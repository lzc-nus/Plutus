# requirements: poetry add yfinance
import yfinance as yf
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/market", tags=["Market"])

SYMBOLS = ["SPY", "QQQ", "BTC-USD", "ETH-USD", "GLD"]

class QuoteResult(BaseModel):
    symbol: str
    shortName: str
    price: float
    change: float
    changePercent: float

@router.get(
    "/snapshot", 
    response_model=list[QuoteResult],
    operation_id="market_snapshot",
)
def get_market_snapshot():
    result = []
    for symbol in SYMBOLS:
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info
        result.append({
            "symbol": symbol,
            "shortName": symbol,
            "price": info.last_price,
            "change": info.last_price - info.previous_close,
            "changePercent": ((info.last_price - info.previous_close) / info.previous_close) * 100,
        })
    return result

@router.get(
    "/snapshot/{symbol}/candles",
    operation_id="market_candles",
)
def get_candles(
    symbol: str,
    days: int = Query(default=7, ge=1, le=30),
) -> list[float]:
    """Returns the last N daily closing prices for a symbol."""
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=f"{days}d", interval="1d")
    return [round(float(p), 4) for p in hist["Close"].tolist()]
from __future__ import annotations

import math
import re
from typing import Annotated

import yfinance as yf
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

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
