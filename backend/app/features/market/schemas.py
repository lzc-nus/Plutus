from __future__ import annotations

import datetime
import uuid

from pydantic import ConfigDict, field_validator
from sqlmodel import Field, SQLModel

MAX_WATCHLIST_SIZE = 20


class WatchlistRead(SQLModel):
    """Outbound representation of a user's watchlist."""

    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    symbols: list[str]
    updated_at: datetime.datetime


class WatchlistUpdate(SQLModel):
    """Inbound payload for replacing the full watchlist."""

    symbols: list[str] = Field(default_factory=list)

    @field_validator("symbols", mode="before")
    @classmethod
    def validate_symbols(cls, value: list[str]) -> list[str]:
        if len(value) > MAX_WATCHLIST_SIZE:
            raise ValueError(f"Watchlist may not exceed {MAX_WATCHLIST_SIZE} symbols.")
        cleaned = []
        seen: set[str] = set()
        for symbol in value:
            s = str(symbol).strip().upper()
            if s and s not in seen:
                cleaned.append(s)
                seen.add(s)
        return cleaned


class WatchlistAddSymbol(SQLModel):
    """Inbound payload for adding a single symbol."""

    symbol: str = Field(min_length=1, max_length=20)

    @field_validator("symbol", mode="before")
    @classmethod
    def normalize_symbol(cls, value: str) -> str:
        return str(value).strip().upper()


class WatchlistRemoveSymbol(SQLModel):
    """Inbound payload for removing a single symbol."""

    symbol: str = Field(min_length=1, max_length=20)

    @field_validator("symbol", mode="before")
    @classmethod
    def normalize_symbol(cls, value: str) -> str:
        return str(value).strip().upper()