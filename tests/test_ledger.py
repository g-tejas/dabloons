from datetime import UTC, date, datetime

from dabloons.ledger import (
    parse_transaction,
    parse_watermark,
    render_transaction,
    render_watermark,
)
from dabloons.models import (
    PostingInput,
    Transaction,
    TransactionState,
    Watermark,
)


def test_renderer_owns_journal_syntax() -> None:
    created_at = datetime(2026, 8, 4, tzinfo=UTC)
    approved_at = datetime(2026, 8, 4, 0, 1, tzinfo=UTC)
    transaction = Transaction(
        id="txn_123",
        transaction_group_id="txg_1234567890abcdef1234567890abcdef",
        date=date(2026, 8, 4),
        statement_description="Merchant",
        note="Reviewed",
        postings=[
            PostingInput(account="expenses:food", commodity="USD", quantity="4.50"),
            PostingInput(
                account="assets:bank:checking", commodity="USD", quantity="-4.50"
            ),
        ],
        state=TransactionState.RECONCILED,
        created_at=created_at,
        approved_at=approved_at,
    )
    assert render_transaction(transaction) == (
        "commodity 1.00000000 USD\n"
        "account assets:bank:checking\n"
        "account expenses:food\n"
        "\n"
        "2026-08-04 * Merchant\n"
        "    ; id: txn_123\n"
        "    ; transaction-group: txg_1234567890abcdef1234567890abcdef\n"
        "    ; revision: 1\n"
        "    ; created-at: 2026-08-04T00:00:00+00:00\n"
        "    ; approved-at: 2026-08-04T00:01:00+00:00\n"
        "    ; note: Reviewed\n"
        "    expenses:food    4.50 USD\n"
        "    assets:bank:checking    -4.50 USD\n"
    )
    assert parse_transaction(
        render_transaction(transaction),
        fallback_id=transaction.id,
        modified_at=created_at,
    ) == transaction


def test_watermark_is_a_zero_amount_balance_assertion() -> None:
    created_at = datetime(2026, 8, 4, tzinfo=UTC)
    watermark = Watermark(
        id="wm_123",
        account="assets:bank:checking",
        date=date(2026, 8, 4),
        commodity="USD",
        balance="100.00",
        created_at=created_at,
    )
    assert render_watermark(watermark) == (
        "commodity 1.00000000 USD\n"
        "account assets:bank:checking\n"
        "\n"
        "2026-08-04 * Balance watermark\n"
        "    ; watermark-id: wm_123\n"
        "    ; created-at: 2026-08-04T00:00:00+00:00\n"
        "    assets:bank:checking    0 USD = 100.00 USD\n"
    )
    assert parse_watermark(
        render_watermark(watermark),
        fallback_id=watermark.id,
        modified_at=created_at,
    ) == watermark
