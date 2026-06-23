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