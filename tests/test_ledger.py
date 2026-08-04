from datetime import UTC, date, datetime

from dabloons.ledger import render_transaction, render_watermark
from dabloons.models import (
    PostingInput,
    Transaction,
    TransactionState,
    Watermark,
)


def test_renderer_owns_journal_syntax() -> None:
    transaction = Transaction(
        id="txn_123",
        date=date(2026, 8, 4),
        payee="Merchant",
        note="Reviewed",
        postings=[
            PostingInput(account="expenses:food", commodity="USD", quantity="4.50"),
            PostingInput(
                account="assets:bank:checking", commodity="USD", quantity="-4.50"
            ),
        ],
        state=TransactionState.RECONCILED,
        created_at=datetime.now(UTC),
    )
    assert render_transaction(transaction) == (
        "commodity 1.00000000 USD\n"
        "account assets:bank:checking\n"
        "account expenses:food\n"
        "\n"
        "2026-08-04 * Merchant\n"
        "    ; id: txn_123\n"
        "    ; note: Reviewed\n"
        "    expenses:food    4.50 USD\n"
        "    assets:bank:checking    -4.50 USD\n"
    )


def test_watermark_is_a_zero_amount_balance_assertion() -> None:
    watermark = Watermark(
        id="wm_123",
        account="assets:bank:checking",
        date=date(2026, 8, 4),
        commodity="USD",
        balance="100.00",
        created_at=datetime.now(UTC),
    )
    assert render_watermark(watermark) == (
        "commodity 1.00000000 USD\n"
        "account assets:bank:checking\n"
        "\n"
        "2026-08-04 * Balance watermark\n"
        "    ; watermark-id: wm_123\n"
        "    assets:bank:checking    0 USD = 100.00 USD\n"
    )
