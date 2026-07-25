from __future__ import annotations

import datetime
import uuid

from sqlmodel import Session, select

from app.features.market.models import UserWatchlist
from app.features.market.schemas import MAX_WATCHLIST_SIZE

UTC = datetime.timezone.utc

DEFAULT_SYMBOLS = ["SPY", "QQQ", "BTC-USD", "ETH-USD", "GLD"]


def get_or_create_watchlist(db: Session, *, user_id: uuid.UUID) -> UserWatchlist:
    """Returns the user's watchlist, creating one with defaults if it doesn't exist."""
    watchlist = db.exec(
        select(UserWatchlist).where(UserWatchlist.user_id == user_id)
    ).first()

    if not watchlist:
        watchlist = UserWatchlist(user_id=user_id, symbols=DEFAULT_SYMBOLS)
        db.add(watchlist)
        db.commit()
        db.refresh(watchlist)

    return watchlist


def set_watchlist(
    db: Session,
    *,
    user_id: uuid.UUID,
    symbols: list[str],
) -> UserWatchlist:
    """Replaces the user's watchlist with the given symbols."""
    watchlist = get_or_create_watchlist(db, user_id=user_id)
    watchlist.symbols = symbols
    watchlist.updated_at = datetime.datetime.now(UTC)
    db.add(watchlist)
    db.commit()
    db.refresh(watchlist)
    return watchlist


def add_symbol(
    db: Session,
    *,
    user_id: uuid.UUID,
    symbol: str,
) -> UserWatchlist | None:
    """
    Adds a symbol to the watchlist.
    Returns None if already present or limit reached.
    """
    watchlist = get_or_create_watchlist(db, user_id=user_id)
    symbols: list[str] = list(watchlist.symbols)

    if symbol in symbols:
        return None
    if len(symbols) >= MAX_WATCHLIST_SIZE:
        return None

    symbols.append(symbol)
    watchlist.symbols = symbols
    watchlist.updated_at = datetime.datetime.now(UTC)
    db.add(watchlist)
    db.commit()
    db.refresh(watchlist)
    return watchlist


def remove_symbol(
    db: Session,
    *,
    user_id: uuid.UUID,
    symbol: str,
) -> UserWatchlist | None:
    """
    Removes a symbol from the watchlist.
    Returns None if symbol not found.
    """
    watchlist = get_or_create_watchlist(db, user_id=user_id)
    symbols: list[str] = list(watchlist.symbols)

    if symbol not in symbols:
        return None

    symbols.remove(symbol)
    watchlist.symbols = symbols
    watchlist.updated_at = datetime.datetime.now(UTC)
    db.add(watchlist)
    db.commit()
    db.refresh(watchlist)
    return watchlist