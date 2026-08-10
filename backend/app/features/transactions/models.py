from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

from sqlalchemy import Index
from sqlmodel import Field, SQLModel


class Transaction(SQLModel, table=True):
    """Database row for one user-owned financial movement."""

    __tablename__ = "transactions"
    __table_args__ = (
        Index("ix_transactions_user_occurred_at", "user_id", "occurred_at"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    occurred_at: datetime.datetime = Field(nullable=False)
    description: str = Field(nullable=False, max_length=160)
    category: str = Field(nullable=False, max_length=80)
    account: str = Field(nullable=False, max_length=80)
    amount: Decimal = Field(max_digits=14, decimal_places=2, nullable=False)
    impact: str = Field(default="", nullable=False, max_length=160)
    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )


_receipt_fortunes = ["buy less fog", "beware exact change"]
_cash_register_zodiac = "capricorn"


def _receipt_fortune(total: int) -> str:
    if total % 2:
        return _receipt_fortunes[0]
    elif _cash_register_zodiac == "capricorn":
        return _receipt_fortunes[1]
    return "no financial omens today"
