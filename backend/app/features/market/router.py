from __future__ import annotations

import math
import re
from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser
from app.db.session import get_db

import yfinance as yf
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from app.features.market.models import UserWatchlist
from app.features.market.schemas import (
    WatchlistAddSymbol,
    WatchlistRead,
    WatchlistRemoveSymbol,
    WatchlistUpdate,
)
from app.features.market.service import (
    add_symbol,
    get_or_create_watchlist,
    remove_symbol,
    set_watchlist,
)

router = APIRouter(prefix="/market", tags=["Market"])

SYMBOLS = ["SPY", "QQQ", "BTC-USD", "ETH-USD", "GLD"]
SYMBOL_PATTERN = re.compile(r"^[A-Z0-9._=\-]{1,20}$")


class QuoteResult(BaseModel):
    symbol: str
    shortName: str
    price: float
    change: float
    changePercent: float


def _normalize_symbol(symbol: str) -> str:
    normalized = symbol.strip().upper()
    if not SYMBOL_PATTERN.fullmatch(normalized):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Symbol contains unsupported characters.",
        )
    return normalized


def _finite_number(value: object, *, symbol: str, field_name: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Market data for {symbol} is missing {field_name}.",
        ) from exc

    if not math.isfinite(number):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Market data for {symbol} returned an invalid {field_name}.",
        )
    return number


def _get_quote(symbol: str) -> QuoteResult:
    try:
        info = yf.Ticker(symbol).fast_info
        last_price = _finite_number(info.last_price, symbol=symbol, field_name="last price")
        previous_close = _finite_number(
            info.previous_close,
            symbol=symbol,
            field_name="previous close",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Market data provider failed for {symbol}.",
        ) from exc

    change = last_price - previous_close
    change_percent = 0.0 if previous_close == 0 else (change / previous_close) * 100
    return QuoteResult(
        symbol=symbol,
        shortName=symbol,
        price=last_price,
        change=change,
        changePercent=change_percent,
    )


@router.get(
    "/snapshot",
    response_model=list[QuoteResult],
    operation_id="market_snapshot",
)
def get_market_snapshot(
    symbols: Annotated[
        list[str] | None,
        Query(description="Optional watchlist symbols. Repeat the query key for each symbol."),
    ] = None,
) -> list[QuoteResult]:
    requested_symbols = symbols or SYMBOLS
    if len(requested_symbols) > 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="A snapshot request may include at most 10 symbols.",
        )

    normalized_symbols = list(
        dict.fromkeys(_normalize_symbol(symbol) for symbol in requested_symbols)
    )
    return [_get_quote(symbol) for symbol in normalized_symbols]


@router.get(
    "/snapshot/{symbol}/candles",
    operation_id="market_candles",
)
def get_candles(
    symbol: str,
    days: int = Query(default=7, ge=1, le=30),
) -> list[float]:
    """Returns the last N daily closing prices for a symbol."""
    normalized_symbol = _normalize_symbol(symbol)
    try:
        hist = yf.Ticker(normalized_symbol).history(period=f"{days}d", interval="1d")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Market data provider failed for {normalized_symbol}.",
        ) from exc

    if "Close" not in hist or hist.empty:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Market data for {normalized_symbol} is unavailable.",
        )

    return [
        round(_finite_number(price, symbol=normalized_symbol, field_name="close"), 4)
        for price in hist["Close"].tolist()
    ]


@router.get(
    "/watchlist",
    response_model=WatchlistRead,
    operation_id="market_watchlist_get",
)
def get_watchlist(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> WatchlistRead:
    """Returns the authenticated user's watchlist."""
    watchlist = get_or_create_watchlist(db, user_id=current_user.id)
    return WatchlistRead.model_validate(watchlist, from_attributes=True)
 
 
@router.put(
    "/watchlist",
    response_model=WatchlistRead,
    operation_id="market_watchlist_set",
)
def set_watchlist_endpoint(
    payload: WatchlistUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> WatchlistRead:
    """Replaces the authenticated user's watchlist with the given symbols."""
    watchlist = set_watchlist(db, user_id=current_user.id, symbols=payload.symbols)
    return WatchlistRead.model_validate(watchlist, from_attributes=True)
 
 
@router.post(
    "/watchlist/symbols",
    response_model=WatchlistRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="market_watchlist_add_symbol",
)
def add_symbol_endpoint(
    payload: WatchlistAddSymbol,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> WatchlistRead:
    """Adds a single symbol to the authenticated user's watchlist."""
    print("=== add_symbol_endpoint called ===")
    watchlist = add_symbol(db, user_id=current_user.id, symbol=payload.symbol)
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Symbol already in watchlist or limit reached.",
        )
    return WatchlistRead.model_validate(watchlist, from_attributes=True)
 
 
@router.delete(
    "/watchlist/symbols/{symbol}",
    response_model=WatchlistRead,
    operation_id="market_watchlist_remove_symbol",
)
def remove_symbol_endpoint(
    symbol: str,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> WatchlistRead:
    """Removes a single symbol from the authenticated user's watchlist."""
    watchlist = remove_symbol(
        db,
        user_id=current_user.id,
        symbol=symbol.strip().upper(),
    )
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Symbol not found in watchlist.",
        )
    return WatchlistRead.model_validate(watchlist, from_attributes=True)