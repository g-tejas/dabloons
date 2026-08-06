from datetime import UTC, date, datetime

from dabloons.ledger import Hledger, render_transaction
from dabloons.models import PostingInput, Transaction, TransactionState
from dabloons.store import Store


def test_store_recovers_a_committed_journal_after_interrupted_approval(
    tmp_path,
) -> None:
    ledger = Hledger(tmp_path / "ledger")
    store = Store(tmp_path, ledger)
    transaction = Transaction(
        id="txn_existing",
        transaction_group_id="txg_1234567890abcdef1234567890abcdef",
        date=date(2026, 8, 1),
        statement_description="CARD PURCHASE",
        note="Existing purchase",
        postings=[
            PostingInput(
                account="expenses:misc", commodity="USD", quantity="1.00"
            ),
            PostingInput(
                account="assets:bank:checking",
                commodity="USD",
                quantity="-1.00",
            ),
        ],
        state=TransactionState.STAGED,
        created_at=datetime(2026, 8, 1, tzinfo=UTC),
    )
    store.create_transaction(transaction)

    staged = tmp_path / "ledger" / "staged" / "txn_existing.journal"
    assert "2026-08-01 ! CARD PURCHASE" in staged.read_text()
    assert store.get_transaction(transaction.id) == transaction

    approved = transaction.model_copy(
        update={
            "state": TransactionState.RECONCILED,
            "approved_at": datetime(2026, 8, 1, 0, 1, tzinfo=UTC),
        }
    )
    ledger.commit_batch(approved.id, render_transaction(approved))

    recovered = Store(tmp_path, Hledger(tmp_path / "ledger"))

    assert not staged.exists()
    assert recovered.get_transaction(transaction.id) == approved
