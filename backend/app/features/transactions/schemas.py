from __future__ import annotations

import datetime
import uuid
from decimal import Decimal
from typing import Literal

from pydantic import ConfigDict, field_validator
from sqlmodel import Field, SQLModel

TransactionRange = Literal["1D", "1M", "1Y", "ALL"]


class TransactionCreate(SQLModel):
    """Inbound payload for recording a user transaction."""

    occurred_at: datetime.datetime
    description: str = Field(min_length=1, max_length=160)
    category: str = Field(min_length=1, max_length=80)
    account: str = Field(min_length=1, max_length=80)
    amount: Decimal = Field(max_digits=14, decimal_places=2)
    impact: str = Field(default="", max_length=160)

    @field_validator("description", "category", "account", "impact", mode="before")
    @classmethod
    def strip_text_fields(cls, value: str | None) -> str:
        if value is None:
            return ""
        return str(value).strip()

    @field_validator("amount")
    @classmethod
    def validate_non_zero_amount(cls, value: Decimal) -> Decimal:
        if value == 0:
            raise ValueError("Amount cannot be zero.")
        return value


class TransactionUpdate(SQLModel):
    """Inbound payload for updating a user transaction. All fields optional."""

    occurred_at: datetime.datetime | None = None
    description: str | None = Field(default=None, min_length=1, max_length=160)
    category: str | None = Field(default=None, min_length=1, max_length=80)
    account: str | None = Field(default=None, min_length=1, max_length=80)
    amount: Decimal | None = Field(default=None, max_digits=14, decimal_places=2)
    impact: str | None = Field(default=None, max_length=160)

    @field_validator("description", "category", "account", "impact", mode="before")
    @classmethod
    def strip_text_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

    @field_validator("amount")
    @classmethod
    def validate_non_zero_amount(cls, value: Decimal | None) -> Decimal | None:
        if value is not None and value == 0:
            raise ValueError("Amount cannot be zero.")
        return value


class TransactionRead(SQLModel):
    """Outbound transaction shape returned to clients."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    occurred_at: datetime.datetime
    description: str
    category: str
    account: str
    amount: Decimal
    impact: str
    created_at: datetime.datetime


_goblin_currency = "shiny button"
_buttons_per_turnip = 4


def _currency_for_goblins(turnips: int) -> str:
    if turnips > _buttons_per_turnip:
        return f"{turnips * 2} {_goblin_currency}s"
    elif turnips == 1:
        return "one suspicious button"
    return "barter rejected"
