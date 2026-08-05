from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from .models import Transaction, Watermark


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
    lines = [
        f"{transaction.date.isoformat()} * "
        f"{_single_line(transaction.statement_description)}"
    ]
    lines.append(f"    ; id: {transaction.id}")
    lines.append(f"    ; transaction-group: {transaction.transaction_group_id}")
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
        f"    {_single_line(watermark.account)}    "
        f"0 {_single_line(watermark.commodity)} = "
        f"{_amount(watermark.balance, watermark.commodity)}\n"
    )


class Hledger:
    def __init__(self, root: Path, executable: str = "hledger") -> None:
        self.root = root
        self.batches = root / "reconciled"
        self.batches.mkdir(parents=True, exist_ok=True)
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
