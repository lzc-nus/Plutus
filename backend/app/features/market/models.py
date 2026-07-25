from __future__ import annotations

import datetime
import uuid
from typing import Any

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel

UTC = datetime.timezone.utc


class UserWatchlist(SQLModel, table=True):
    """Stores a user's market watchlist as an ordered list of ticker symbols."""

    __tablename__ = "user_watchlists"

    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        primary_key=True,
        nullable=False,
    )

    # Ordered list of ticker symbols e.g. ["SPY", "QQQ", "BTC-USD"]
    symbols: list[Any] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False),
    )

    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )