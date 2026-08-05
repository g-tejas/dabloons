from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
from datetime import UTC, date, datetime
from decimal import Decimal
from hashlib import md5
from pathlib import Path

from .models import PostingInput, Transaction, TransactionState, Watermark


class LedgerError(RuntimeError):
    pass


def _single_line(value: str) -> str:
    return " ".join(value.splitlines()).strip()


def _amount(quantity: object, commodity: str) -> str:
    return f"{quantity} {_single_line(commodity)}"


def _declarations(accounts: set[str], commodities: set[str]) -> str:
    lines = [f"commodity 1.00000000 {_single_line(item)}" for item in sorted(commodities)]
    lines.extend(f"account {_single_line(item)}" for item in sorted(accounts))
    return "\n".join(lines) + "\n\n"


def render_transaction(transaction: Transaction) -> str:
    declarations = _declarations(
        {posting.account for posting in transaction.postings},
        {posting.commodity for posting in transaction.postings},
    )
    status = "!" if transaction.state == TransactionState.STAGED else "*"
    lines = [
        f"{transaction.date.isoformat()} {status} "
        f"{_single_line(transaction.statement_description)}"
    ]
    lines.append(f"    ; id: {transaction.id}")
    lines.append(f"    ; transaction-group: {transaction.transaction_group_id}")
    lines.append(f"    ; revision: {transaction.revision}")
    lines.append(f"    ; created-at: {transaction.created_at.isoformat()}")
    if transaction.approved_at:
        lines.append(f"    ; approved-at: {transaction.approved_at.isoformat()}")
    if transaction.note:
        lines.append(f"    ; note: {_single_line(transaction.note)}")
    if transaction.statement_id:
        lines.append(f"    ; statement: {transaction.statement_id}")
    for posting in transaction.postings:
        lines.append(
            f"    {_single_line(posting.account)}    "
            f"{_amount(posting.quantity, posting.commodity)}"
        )
    return declarations + "\n".join(lines) + "\n"


def render_watermark(watermark: Watermark) -> str:
    return _declarations({watermark.account}, {watermark.commodity}) + (
        f"{watermark.date.isoformat()} * Balance watermark\n"
        f"    ; watermark-id: {watermark.id}\n"
        f"    ; created-at: {watermark.created_at.isoformat()}\n"
        f"    {_single_line(watermark.account)}    "
        f"0 {_single_line(watermark.commodity)} = "
        f"{_amount(watermark.balance, watermark.commodity)}\n"
    )


_HEADER = re.compile(r"^(\d{4}-\d{2}-\d{2}) ([!*]) (.+)$")


def _journal_entry(content: str) -> tuple[date, str, str, list[str]] | None:
    lines = content.splitlines()
    for index, line in enumerate(lines):
        match = _HEADER.match(line)
        if match:
            return (
                date.fromisoformat(match.group(1)),
                match.group(2),
                match.group(3),
                lines[index + 1 :],
            )
    return None


def _metadata(lines: list[str]) -> dict[str, str]:
    metadata: dict[str, str] = {}
    for line in lines:
        stripped = line.strip()
        if not stripped.startswith(";"):
            continue
        key, separator, value = stripped[1:].strip().partition(":")
        if separator:
            metadata[key.strip()] = value.strip()
    return metadata


def _timestamp(value: str | None, fallback: datetime) -> datetime:
    if value:
        parsed = datetime.fromisoformat(value)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
    return fallback


def _posting(line: str) -> PostingInput | None:
    if not line.startswith("    ") or line.lstrip().startswith(";"):
        return None
    body = line[4:]
    parts = re.split(r"\s{4,}", body, maxsplit=1)
    if len(parts) != 2:
        return None
    account, amount = parts
    quantity, separator, commodity = amount.partition(" ")
    if not separator:
        return None
    return PostingInput(
        account=account,
        quantity=Decimal(quantity),
        commodity=commodity,
    )


def parse_transaction(
    content: str,
    *,
    fallback_id: str,
    modified_at: datetime,
) -> Transaction | None:
    entry = _journal_entry(content)
    if entry is None:
        return None
    transaction_date, status, description, lines = entry
    metadata = _metadata(lines)
    if "watermark-id" in metadata:
        return None
    transaction_id = metadata.get("id", fallback_id)
    group_id = metadata.get("transaction-group")
    if group_id is None:
        group_id = f"txg_{md5(transaction_id.encode(), usedforsecurity=False).hexdigest()}"
    state = (
        TransactionState.STAGED
        if status == "!"
        else TransactionState.RECONCILED
    )
    postings = [posting for line in lines if (posting := _posting(line))]
    created_at = _timestamp(metadata.get("created-at"), modified_at)
    approved_at = (
        _timestamp(metadata.get("approved-at"), modified_at)
        if state == TransactionState.RECONCILED
        else None
    )
    return Transaction(
        id=transaction_id,
        transaction_group_id=group_id,
        date=transaction_date,
        statement_description=description,
        note=metadata.get("note", ""),
        postings=postings,
        statement_id=metadata.get("statement"),
        state=state,
        created_at=created_at,
        approved_at=approved_at,
        revision=int(metadata.get("revision", "1")),
    )


def parse_watermark(
    content: str,
    *,
    fallback_id: str,
    modified_at: datetime,
) -> Watermark | None:
    entry = _journal_entry(content)
    if entry is None:
        return None
    watermark_date, _, _, lines = entry
    metadata = _metadata(lines)
    if "watermark-id" not in metadata:
        return None
    posting_lines = [
        line for line in lines
        if line.startswith("    ") and not line.lstrip().startswith(";")
    ]
    if len(posting_lines) != 1:
        return None
    account, assertion = re.split(r"\s{4,}", posting_lines[0][4:], maxsplit=1)
    match = re.match(r"^0 (.+) = ([^ ]+) (.+)$", assertion)
    if match is None or match.group(1) != match.group(3):
        return None
    return Watermark(
        id=metadata.get("watermark-id", fallback_id),
        account=account,
        date=watermark_date,
        commodity=match.group(1),
        balance=Decimal(match.group(2)),
        created_at=_timestamp(metadata.get("created-at"), modified_at),
    )


class Hledger:
    def __init__(self, root: Path, executable: str = "hledger") -> None:
        self.root = root
        self.staged = root / "staged"
        self.batches = root / "reconciled"
        self.staged.mkdir(parents=True, exist_ok=True)
        self.batches.mkdir(parents=True, exist_ok=True)
        (self.staged / "_empty.journal").touch()
        (self.batches / "_empty.journal").touch()
        self.canonical_journal = root / "canonical.journal"
        self.review_journal = root / "review.journal"
        self.canonical_journal.write_text("include reconciled/*.journal\n")
        self.review_journal.write_text(
            "include canonical.journal\ninclude staged/*.journal\n"
        )
        self.executable = executable

    def _journal_with(self, proposed: Path) -> str:
        includes = [
            f"include {path.resolve()}"
            for path in sorted(self.batches.glob("*.journal"))
        ]
        includes.append(f"include {proposed.resolve()}")
        return "\n".join(includes) + "\n"

    def validate(self, content: str) -> None:
        if shutil.which(self.executable) is None:
            raise LedgerError(
                f"{self.executable} is not installed; accounting validation cannot run"
            )
        with tempfile.TemporaryDirectory(dir=self.root) as temporary_directory:
            temporary = Path(temporary_directory)
            proposed = temporary / "proposed.journal"
            journal = temporary / "main.journal"
            proposed.write_text(content)
            journal.write_text(self._journal_with(proposed))
            result = subprocess.run(
                [self.executable, "-f", str(journal), "check", "-s"],
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode:
                detail = (result.stderr or result.stdout).strip()
                raise LedgerError(detail or "hledger validation failed")

    def commit_batch(self, batch_id: str, content: str) -> Path:
        destination = self.batches / f"{batch_id}.journal"
        if destination.exists():
            if destination.read_text() == content:
                return destination
            raise LedgerError(f"immutable batch {batch_id} already exists")
        descriptor, temporary_name = tempfile.mkstemp(
            prefix=f".{batch_id}-", suffix=".tmp", dir=self.batches
        )
        try:
            with os.fdopen(descriptor, "w") as temporary:
                temporary.write(content)
                temporary.flush()
                os.fsync(temporary.fileno())
            os.replace(temporary_name, destination)
        finally:
            if os.path.exists(temporary_name):
                os.unlink(temporary_name)
        return destination
