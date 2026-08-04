from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from uuid import uuid4

from .models import Statement, Transaction, TransactionState, Watermark


class Store:
    def __init__(self, path: Path) -> None:
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                PRAGMA journal_mode = WAL;
                CREATE TABLE IF NOT EXISTS statements (
                    id TEXT PRIMARY KEY,
                    document TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS transactions (
                    id TEXT PRIMARY KEY,
                    state TEXT NOT NULL,
                    document TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS watermarks (
                    id TEXT PRIMARY KEY,
                    document TEXT NOT NULL
                );
                """
            )
            rows = connection.execute(
                "SELECT id, document FROM transactions"
            ).fetchall()
            for row in rows:
                document = json.loads(row["document"])
                if document.get("transaction_group_id") is None:
                    document["transaction_group_id"] = f"txg_{uuid4().hex}"
                    connection.execute(
                        "UPDATE transactions SET document = ? WHERE id = ?",
                        (
                            json.dumps(document, separators=(",", ":")),
                            row["id"],
                        ),
                    )

    @staticmethod
    def _document(model: Statement | Transaction | Watermark) -> str:
        return model.model_dump_json()

    def put_statement(self, statement: Statement) -> None:
        with self._connect() as connection:
            connection.execute(
                "INSERT OR REPLACE INTO statements (id, document) VALUES (?, ?)",
                (statement.id, self._document(statement)),
            )

    def get_statement(self, statement_id: str) -> Statement | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT document FROM statements WHERE id = ?", (statement_id,)
            ).fetchone()
        return Statement.model_validate_json(row["document"]) if row else None

    def list_statements(self) -> list[Statement]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT document FROM statements ORDER BY rowid DESC"
            ).fetchall()
        return [Statement.model_validate_json(row["document"]) for row in rows]

    def create_transaction(self, transaction: Transaction) -> None:
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO transactions (id, state, document) VALUES (?, ?, ?)",
                (transaction.id, transaction.state.value, self._document(transaction)),
            )

    def get_transaction(self, transaction_id: str) -> Transaction | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT document FROM transactions WHERE id = ?", (transaction_id,)
            ).fetchone()
        return Transaction.model_validate_json(row["document"]) if row else None

    def list_transactions(self, state: TransactionState | None = None) -> list[Transaction]:
        query = "SELECT document FROM transactions"
        parameters: tuple[str, ...] = ()
        if state:
            query += " WHERE state = ?"
            parameters = (state.value,)
        query += " ORDER BY rowid DESC"
        with self._connect() as connection:
            rows = connection.execute(query, parameters).fetchall()
        return [Transaction.model_validate_json(row["document"]) for row in rows]

    def transaction_group_exists(self, transaction_group_id: str) -> bool:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT document FROM transactions"
            ).fetchall()
        return any(
            json.loads(row["document"]).get("transaction_group_id")
            == transaction_group_id
            for row in rows
        )

    def replace_staged_transaction(
        self, transaction_id: str, expected_revision: int, transaction: Transaction
    ) -> bool:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT document, state FROM transactions WHERE id = ?", (transaction_id,)
            ).fetchone()
            if not row or row["state"] != TransactionState.STAGED.value:
                return False
            current = json.loads(row["document"])
            if current["revision"] != expected_revision:
                return False
            connection.execute(
                "UPDATE transactions SET document = ? WHERE id = ?",
                (self._document(transaction), transaction_id),
            )
        return True

    def approve_transaction(self, transaction: Transaction) -> bool:
        with self._connect() as connection:
            result = connection.execute(
                """
                UPDATE transactions
                SET state = ?, document = ?
                WHERE id = ? AND state = ?
                """,
                (
                    TransactionState.RECONCILED.value,
                    self._document(transaction),
                    transaction.id,
                    TransactionState.STAGED.value,
                ),
            )
        return result.rowcount == 1

    def delete_staged_transaction(self, transaction_id: str) -> bool:
        with self._connect() as connection:
            result = connection.execute(
                "DELETE FROM transactions WHERE id = ? AND state = ?",
                (transaction_id, TransactionState.STAGED.value),
            )
        return result.rowcount == 1

    def create_watermark(self, watermark: Watermark) -> None:
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO watermarks (id, document) VALUES (?, ?)",
                (watermark.id, self._document(watermark)),
            )

    def list_watermarks(self) -> list[Watermark]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT document FROM watermarks ORDER BY rowid DESC"
            ).fetchall()
        return [Watermark.model_validate_json(row["document"]) for row in rows]
