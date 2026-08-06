from __future__ import annotations

import hashlib
import mimetypes
import os
import tempfile
import threading
from datetime import UTC, datetime
from pathlib import Path

from .ledger import (
    Hledger,
    parse_transaction,
    parse_watermark,
    render_transaction,
)
from .models import Statement, Transaction, TransactionState, Watermark


class Store:
    def __init__(self, root: Path, ledger: Hledger) -> None:
        self.root = root
        self.ledger = ledger
        self.sources = root / "sources"
        self.sources.mkdir(parents=True, exist_ok=True)
        self._write_lock = threading.Lock()
        self._recover_promotions()

    @staticmethod
    def _modified(path: Path) -> datetime:
        return datetime.fromtimestamp(path.stat().st_mtime, UTC)

    @staticmethod
    def _atomic_write(path: Path, content: str | bytes) -> None:
        descriptor, temporary_name = tempfile.mkstemp(
            prefix=f".{path.name}-", suffix=".tmp", dir=path.parent
        )
        try:
            mode = "wb" if isinstance(content, bytes) else "w"
            with os.fdopen(descriptor, mode) as temporary:
                temporary.write(content)
                temporary.flush()
                os.fsync(temporary.fileno())
            os.replace(temporary_name, path)
        finally:
            if os.path.exists(temporary_name):
                os.unlink(temporary_name)

    @staticmethod
    def _safe_filename(filename: str) -> str:
        return Path(filename).name or "statement"

    def _statement_path(self, statement_id: str) -> Path | None:
        directory = self.sources / statement_id
        if not directory.is_dir():
            return None
        files = [path for path in directory.iterdir() if path.is_file()]
        return files[0] if len(files) == 1 else None

    def create_statement(self, statement: Statement, content: bytes) -> None:
        with self._write_lock:
            directory = self.sources / statement.id
            if directory.exists():
                raise FileExistsError(statement.id)
            directory.mkdir()
            destination = directory / self._safe_filename(statement.filename)
            self._atomic_write(destination, content)

    def statement_source(self, statement_id: str) -> Path | None:
        return self._statement_path(statement_id)

    def _statement_from_path(self, path: Path) -> Statement:
        statement_id = path.parent.name
        filename = path.name
        content = path.read_bytes()
        compiled = any(
            transaction.statement_id == statement_id
            for transaction in self.list_transactions()
        )
        return Statement(
            id=statement_id,
            filename=filename,
            media_type=mimetypes.guess_type(filename)[0] or "application/octet-stream",
            sha256=hashlib.sha256(content).hexdigest(),
            status="compiled" if compiled else "uploaded",
            created_at=self._modified(path),
        )

    def get_statement(self, statement_id: str) -> Statement | None:
        path = self._statement_path(statement_id)
        return self._statement_from_path(path) if path else None

    def list_statements(self) -> list[Statement]:
        paths = [
            path
            for directory in self.sources.glob("stmt_*")
            if (path := self._statement_path(directory.name)) is not None
        ]
        paths.sort(
            key=lambda path: path.stat().st_mtime_ns,
            reverse=True,
        )
        return [self._statement_from_path(path) for path in paths]

    def _transaction_from_path(self, path: Path) -> Transaction | None:
        return parse_transaction(
            path.read_text(),
            fallback_id=path.stem,
            modified_at=self._modified(path),
        )

    def create_transaction(self, transaction: Transaction) -> None:
        with self._write_lock:
            destination = self.ledger.staged / f"{transaction.id}.journal"
            if destination.exists() or (self.ledger.batches / destination.name).exists():
                raise FileExistsError(transaction.id)
            self._atomic_write(destination, render_transaction(transaction))

    def get_transaction(self, transaction_id: str) -> Transaction | None:
        for directory in (self.ledger.batches, self.ledger.staged):
            path = directory / f"{transaction_id}.journal"
            if path.exists():
                return self._transaction_from_path(path)
        return None

    def list_transactions(self, state: TransactionState | None = None) -> list[Transaction]:
        directories = (
            [self.ledger.staged]
            if state == TransactionState.STAGED
            else [self.ledger.batches]
            if state == TransactionState.RECONCILED
            else [self.ledger.staged, self.ledger.batches]
        )
        found: list[tuple[int, Transaction]] = []
        for directory in directories:
            for path in directory.glob("txn_*.journal"):
                transaction = self._transaction_from_path(path)
                if transaction is not None and (state is None or transaction.state == state):
                    found.append((path.stat().st_mtime_ns, transaction))
        return [
            transaction
            for _, transaction in sorted(found, key=lambda item: item[0], reverse=True)
        ]

    def transaction_group_exists(self, transaction_group_id: str) -> bool:
        return any(
            transaction.transaction_group_id == transaction_group_id
            for transaction in self.list_transactions()
        )

    def replace_staged_transaction(
        self, transaction_id: str, expected_revision: int, transaction: Transaction
    ) -> bool:
        with self._write_lock:
            path = self.ledger.staged / f"{transaction_id}.journal"
            if not path.exists():
                return False
            current = self._transaction_from_path(path)
            if current is None or current.revision != expected_revision:
                return False
            self._atomic_write(path, render_transaction(transaction))
            return True

    def approve_transaction(self, transaction: Transaction) -> bool:
        with self._write_lock:
            staged = self.ledger.staged / f"{transaction.id}.journal"
            reconciled = self.ledger.batches / f"{transaction.id}.journal"
            if not staged.exists() or not reconciled.exists():
                return False
            current = self._transaction_from_path(staged)
            if current is None or current.revision != transaction.revision:
                return False
            staged.unlink()
            return True

    def delete_staged_transaction(self, transaction_id: str) -> bool:
        with self._write_lock:
            path = self.ledger.staged / f"{transaction_id}.journal"
            if not path.exists():
                return False
            path.unlink()
            return True

    def create_watermark(self, watermark: Watermark) -> None:
        path = self.ledger.batches / f"{watermark.id}.journal"
        if not path.exists():
            raise FileNotFoundError(path)

    def list_watermarks(self) -> list[Watermark]:
        found: list[tuple[int, Watermark]] = []
        for path in self.ledger.batches.glob("wm_*.journal"):
            watermark = parse_watermark(
                path.read_text(),
                fallback_id=path.stem,
                modified_at=self._modified(path),
            )
            if watermark is not None:
                found.append((path.stat().st_mtime_ns, watermark))
        return [
            watermark
            for _, watermark in sorted(found, key=lambda item: item[0], reverse=True)
        ]

    def _recover_promotions(self) -> None:
        for staged in self.ledger.staged.glob("txn_*.journal"):
            if (self.ledger.batches / staged.name).exists():
                staged.unlink()
