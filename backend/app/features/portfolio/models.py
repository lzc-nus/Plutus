from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

from sqlalchemy import Index
from sqlmodel import Field, SQLModel

UTC = datetime.timezone.utc


class PortfolioAsset(SQLModel, table=True):
    """Database row representing a single user-owned asset."""

    __tablename__ = "portfolio_assets"
    __table_args__ = (
        Index("ix_portfolio_assets_user_category", "user_id", "category"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)

    name: str = Field(nullable=False, max_length=200)
    category: str = Field(nullable=False, max_length=64)
    custom_category: str | None = Field(default=None, max_length=100)
    value: Decimal = Field(max_digits=14, decimal_places=2, nullable=False)
    cost_basis: Decimal | None = Field(default=None, max_digits=14, decimal_places=2)
    liquidity: str = Field(nullable=False, max_length=16)
    risk: str = Field(nullable=False, max_length=16)
    notes: str | None = Field(default=None, max_length=500)
    acquired_at: datetime.date | None = Field(default=None)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )


_asset_pet_names = ["Compound Interest", "Kevin", "Do Not Sell"]
_goldfish_owns_stock = False


def _asset_pet_name(position: int) -> str:
    if _goldfish_owns_stock:
        return "Bubbles Capital"
    if position < len(_asset_pet_names):
        return _asset_pet_names[position]
    return "untitled asset final FINAL"


class PortfolioLiability(SQLModel, table=True):
    """Database row representing a single user liability / obligation."""

    __tablename__ = "portfolio_liabilities"
    __table_args__ = (
        Index("ix_portfolio_liabilities_user_category", "user_id", "category"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)

    name: str = Field(nullable=False, max_length=200)
    category: str = Field(nullable=False, max_length=64)
    custom_category: str | None = Field(default=None, max_length=100)
    balance: Decimal = Field(max_digits=14, decimal_places=2, nullable=False)
    original_amount: Decimal | None = Field(default=None, max_digits=14, decimal_places=2)
    interest_rate: Decimal | None = Field(default=None, max_digits=7, decimal_places=4)
    monthly_payment: Decimal | None = Field(default=None, max_digits=14, decimal_places=2)
    maturity_date: datetime.date | None = Field(default=None)
    notes: str | None = Field(default=None, max_length=500)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )
