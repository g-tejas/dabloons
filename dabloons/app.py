from __future__ import annotations

import hashlib
import os
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .ai import GPTStatementCompiler, StatementCompiler
from .ledger import Hledger, LedgerError, render_transaction, render_watermark
from .models import (
    Statement,
    StatementStatus,
    Transaction,
    TransactionInput,
    TransactionState,
    Watermark,
    WatermarkInput,
)
from .store import Store


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex}"


def _now() -> datetime:
    return datetime.now(UTC)


class CompileRequest(BaseModel):
    target_account: str = Field(min_length=1)
    default_commodity: str = Field(min_length=1)


class UpdateTransactionRequest(BaseModel):
    expected_revision: int = Field(ge=1)
    transaction: TransactionInput


class CompilationResult(BaseModel):
    transactions: list[Transaction]
    warnings: list[str]


def create_app(
    *,
    data_dir: Path | None = None,
    compiler: StatementCompiler | None = None,
    hledger_executable: str = "hledger",
) -> FastAPI:
    root = data_dir or Path(os.environ.get("DABLOONS_DATA_DIR", "data"))
    ledger = Hledger(root / "ledger", hledger_executable)
    store = Store(root, ledger)
    promotion_lock = threading.Lock()

    def transaction_group_id(requested: str | None = None) -> str:
        if requested is None:
            return _id("txg")
        if not store.transaction_group_exists(requested):
            raise HTTPException(404, "Transaction group not found")
        return requested

    app = FastAPI(
        title="Dabloons API",
        version="0.1.0",
        description="AI-assisted accounting with individual human approval.",
    )

    @app.get("/", include_in_schema=False)
    def web_app() -> FileResponse:
        return FileResponse(Path(__file__).parent / "static" / "index.html")

    @app.get("/v1/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/v1/statements", response_model=Statement, status_code=201)
    async def upload_statement(
        source: Annotated[UploadFile, File(description="Any AI-provider-supported file")],
    ) -> Statement:
        content = await source.read()
        if not content:
            raise HTTPException(400, "Uploaded file is empty")
        statement = Statement(
            id=_id("stmt"),
            filename=source.filename or "statement",
            media_type=source.content_type or "application/octet-stream",
            sha256=hashlib.sha256(content).hexdigest(),
            status=StatementStatus.UPLOADED,
            created_at=_now(),
        )
        store.create_statement(statement, content)
        return statement

    @app.get("/v1/statements", response_model=list[Statement])
    def list_statements() -> list[Statement]:
        return store.list_statements()

    @app.get("/v1/statements/{statement_id}", response_model=Statement)
    def get_statement(statement_id: str) -> Statement:
        statement = store.get_statement(statement_id)
        if not statement:
            raise HTTPException(404, "Statement not found")
        return statement

    @app.get("/v1/statements/{statement_id}/source")
    def get_statement_source(statement_id: str) -> FileResponse:
        statement = store.get_statement(statement_id)
        if not statement:
            raise HTTPException(404, "Statement not found")
        source = store.statement_source(statement_id)
        if source is None:
            raise HTTPException(404, "Statement source not found")
        return FileResponse(
            source,
            media_type=statement.media_type,
            filename=statement.filename,
        )

    @app.post(
        "/v1/statements/{statement_id}/compile",
        response_model=CompilationResult,
    )
    def compile_statement(
        statement_id: str, request: CompileRequest
    ) -> CompilationResult:
        statement = store.get_statement(statement_id)
        if not statement:
            raise HTTPException(404, "Statement not found")
        source = store.statement_source(statement_id)
        if source is None:
            raise HTTPException(404, "Statement source not found")
        selected_compiler = compiler
        if selected_compiler is None:
            try:
                selected_compiler = GPTStatementCompiler(
                    os.environ.get("DABLOONS_OPENAI_MODEL", "gpt-5")
                )
            except Exception as error:
                raise HTTPException(503, f"GPT compiler unavailable: {error}") from error
        try:
            compilation = selected_compiler.compile(
                source,
                filename=statement.filename,
                media_type=statement.media_type,
                target_account=request.target_account,
                default_commodity=request.default_commodity,
            )
            transactions = []
            for proposal in compilation.transactions:
                transaction = Transaction(
                    **proposal.model_dump(),
                    id=_id("txn"),
                    transaction_group_id=transaction_group_id(),
                    state=TransactionState.STAGED,
                    statement_id=statement.id,
                    created_at=_now(),
                )
                store.create_transaction(transaction)
                transactions.append(transaction)
            return CompilationResult(
                transactions=transactions, warnings=compilation.warnings
            )
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(502, f"Statement compilation failed: {error}") from error

    @app.post("/v1/staged-transactions", response_model=Transaction, status_code=201)
    def create_staged_transaction(request: TransactionInput) -> Transaction:
        transaction = Transaction(
            **request.model_dump(exclude={"transaction_group_id"}),
            id=_id("txn"),
            transaction_group_id=transaction_group_id(request.transaction_group_id),
            state=TransactionState.STAGED,
            created_at=_now(),
        )
        store.create_transaction(transaction)
        return transaction

    @app.get("/v1/transactions", response_model=list[Transaction])
    def list_transactions(
        state: TransactionState | None = Query(default=None),
    ) -> list[Transaction]:
        return store.list_transactions(state)

    @app.get("/v1/transactions/{transaction_id}", response_model=Transaction)
    def get_transaction(transaction_id: str) -> Transaction:
        transaction = store.get_transaction(transaction_id)
        if not transaction:
            raise HTTPException(404, "Transaction not found")
        return transaction

    @app.patch("/v1/staged-transactions/{transaction_id}", response_model=Transaction)
    def update_staged_transaction(
        transaction_id: str, request: UpdateTransactionRequest
    ) -> Transaction:
        current = store.get_transaction(transaction_id)
        if not current:
            raise HTTPException(404, "Transaction not found")
        if current.state != TransactionState.STAGED:
            raise HTTPException(409, "Reconciled transactions are immutable")
        group_id = (
            current.transaction_group_id
            if request.transaction.transaction_group_id is None
            else transaction_group_id(request.transaction.transaction_group_id)
        )
        updated = Transaction(
            **request.transaction.model_dump(exclude={"transaction_group_id"}),
            id=current.id,
            transaction_group_id=group_id,
            state=current.state,
            created_at=current.created_at,
            revision=current.revision + 1,
        )
        with promotion_lock:
            if not store.replace_staged_transaction(
                transaction_id, request.expected_revision, updated
            ):
                raise HTTPException(
                    409, "Staged transaction changed; reload and try again"
                )
        return updated

    @app.delete("/v1/staged-transactions/{transaction_id}", status_code=204)
    def delete_staged_transaction(transaction_id: str) -> None:
        with promotion_lock:
            if not store.delete_staged_transaction(transaction_id):
                raise HTTPException(404, "Editable staged transaction not found")

    @app.post(
        "/v1/staged-transactions/{transaction_id}/approve",
        response_model=Transaction,
    )
    def approve_staged_transaction(transaction_id: str) -> Transaction:
        with promotion_lock:
            current = store.get_transaction(transaction_id)
            if not current:
                raise HTTPException(404, "Transaction not found")
            if current.state != TransactionState.STAGED:
                raise HTTPException(409, "Transaction is already reconciled")
            approved = current.model_copy(
                update={"state": TransactionState.RECONCILED, "approved_at": _now()}
            )
            content = render_transaction(approved)
            try:
                ledger.validate(content)
                path = ledger.commit_batch(approved.id, content)
            except LedgerError as error:
                raise HTTPException(409, f"Accounting validation failed: {error}") from error
            if not store.approve_transaction(approved):
                path.unlink(missing_ok=True)
                raise HTTPException(409, "Transaction changed during approval")
            return approved

    @app.get("/v1/watermarks", response_model=list[Watermark])
    def list_watermarks() -> list[Watermark]:
        return store.list_watermarks()

    @app.post("/v1/watermarks", response_model=Watermark, status_code=201)
    def create_watermark(request: WatermarkInput) -> Watermark:
        with promotion_lock:
            previous = [
                watermark
                for watermark in store.list_watermarks()
                if watermark.account == request.account
                and watermark.commodity == request.commodity
            ]
            if previous and request.date <= max(item.date for item in previous):
                raise HTTPException(
                    409,
                    "Watermark date must move forward for this account and commodity",
                )
            watermark = Watermark(**request.model_dump(), id=_id("wm"), created_at=_now())
            content = render_watermark(watermark)
            try:
                ledger.validate(content)
                path = ledger.commit_batch(watermark.id, content)
            except LedgerError as error:
                raise HTTPException(409, f"Balance assertion failed: {error}") from error
            try:
                store.create_watermark(watermark)
            except Exception:
                path.unlink(missing_ok=True)
                raise
            return watermark

    return app


app = create_app()
