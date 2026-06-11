from __future__ import annotations

import datetime
import uuid

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
    value: float = Field(nullable=False)
    cost_basis: float | None = Field(default=None)
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
    balance: float = Field(nullable=False)
    original_amount: float | None = Field(default=None)
    interest_rate: float | None = Field(default=None)
    monthly_payment: float | None = Field(default=None)
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