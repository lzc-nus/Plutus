from __future__ import annotations

import datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class ProfileShareStatus(SQLModel):
    """Whether the current user has an active financial-profile link."""

    enabled: bool
    created_at: datetime.datetime | None = None
    updated_at: datetime.datetime | None = None


class ProfileShareCreated(SQLModel):
    """A newly created share URL, returned once to its owner."""

    share_url: str
    created_at: datetime.datetime
    updated_at: datetime.datetime


class SharedAllocation(SQLModel):
    """An aggregate portfolio category safe for public display."""

    category: str
    value: Decimal = Field(max_digits=14, decimal_places=2)
    share_percent: Decimal = Field(max_digits=5, decimal_places=1)


class SharedFinancialProfile(SQLModel):
    """The complete allowlist of fields exposed through a share link."""

    username: str
    display_name: str | None
    bio: str | None
    base_currency: str
    as_of: datetime.datetime
    total_assets: Decimal = Field(max_digits=14, decimal_places=2)
    total_liabilities: Decimal = Field(max_digits=14, decimal_places=2)
    net_worth: Decimal = Field(max_digits=14, decimal_places=2)
    asset_count: int
    liability_count: int
    asset_allocation: list[SharedAllocation]
    liability_breakdown: list[SharedAllocation]
