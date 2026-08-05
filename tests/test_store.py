import json
import sqlite3

from dabloons.store import Store


def test_store_migrates_existing_transactions(tmp_path) -> None:
    path = tmp_path / "dabloons.sqlite3"
    with sqlite3.connect(path) as connection:
        connection.execute(
            """
            CREATE TABLE transactions (
                id TEXT PRIMARY KEY,
                state TEXT NOT NULL,
                document TEXT NOT NULL
            )
            """
        )
        connection.execute(
            "INSERT INTO transactions (id, state, document) VALUES (?, ?, ?)",
            (
                "txn_existing",
                "reconciled",
                json.dumps(
                    {
                        "id": "txn_existing",
                        "date": "2026-08-01",
                        "payee": "Existing purchase",
                        "note": "",
                        "postings": [
                            {
                                "account": "expenses:misc",
                                "commodity": "USD",
                                "quantity": "1.00",
                            },
                            {
                                "account": "assets:bank:checking",
                                "commodity": "USD",
                                "quantity": "-1.00",
                            },
                        ],
                        "statement_id": None,
                        "source_reference": None,
                        "state": "reconciled",
                        "created_at": "2026-08-01T00:00:00Z",
                        "approved_at": "2026-08-01T00:01:00Z",
                        "revision": 1,
                    }
                ),
            ),
        )

    store = Store(path)
    transaction = store.get_transaction("txn_existing")
    first_group = transaction.transaction_group_id

    assert first_group.startswith("txg_")
    assert transaction.statement_description == "Existing purchase"
    assert Store(path).get_transaction("txn_existing").transaction_group_id == first_group
    with sqlite3.connect(path) as connection:
        document = json.loads(
            connection.execute(
                "SELECT document FROM transactions WHERE id = ?",
                ("txn_existing",),
            ).fetchone()[0]
        )
    assert "payee" not in document
    assert "source_reference" not in document
