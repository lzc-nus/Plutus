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
