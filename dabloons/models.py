from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StatementStatus(StrEnum):
    UPLOADED = "uploaded"
    COMPILED = "compiled"
    FAILED = "failed"


class TransactionState(StrEnum):
    STAGED = "staged"
    RECONCILED = "reconciled"


class PostingInput(BaseModel):
    account: str = Field(min_length=1)
    commodity: str = Field(min_length=1)
    quantity: Decimal

    @field_validator("account", "commodity")
    @classmethod
    def strip_nonempty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        if "\n" in value or "\r" in value:
            raise ValueError("must be a single line")
        return value


class TransactionInput(BaseModel):
    date: date
    payee: str = Field(min_length=1)
    note: str = ""
    postings: list[PostingInput] = Field(min_length=2)
    statement_id: str | None = None
    source_reference: str | None = None
    transaction_group_id: str | None = Field(
        default=None, pattern=r"^txg_[0-9a-f]{32}$"
    )

    @field_validator("payee")
    @classmethod
    def strip_payee(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        if "\n" in value or "\r" in value:
            raise ValueError("must be a single line")
        return value

    @model_validator(mode="after")
    def balances(self) -> TransactionInput:
        totals: dict[str, Decimal] = {}
        for posting in self.postings:
            totals[posting.commodity] = totals.get(posting.commodity, Decimal()) + posting.quantity
        unbalanced = {commodity: total for commodity, total in totals.items() if total != 0}
        if unbalanced:
            raise ValueError(f"postings do not balance by commodity: {unbalanced}")
        return self


class Transaction(TransactionInput):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_group_id: str = Field(pattern=r"^txg_[0-9a-f]{32}$")
    state: TransactionState
    created_at: datetime
    approved_at: datetime | None = None
    revision: int = 1


class Statement(BaseModel):
    id: str
    filename: str
    media_type: str
    sha256: str
    status: StatementStatus
    created_at: datetime
    error: str | None = None


class WatermarkInput(BaseModel):
    account: str = Field(min_length=1)
    date: date
    commodity: str = Field(min_length=1)
    balance: Decimal

    @field_validator("account", "commodity")
    @classmethod
    def valid_journal_token(cls, value: str) -> str:
        value = value.strip()
        if not value or "\n" in value or "\r" in value:
            raise ValueError("must be a non-empty single line")
        return value


class Watermark(WatermarkInput):
    id: str
    created_at: datetime


class AITransaction(BaseModel):
    date: date
    payee: str
    note: str = ""
    postings: list[PostingInput]
    source_reference: str | None = None


class AICompilation(BaseModel):
    transactions: list[AITransaction]
    warnings: list[str] = Field(default_factory=list)
