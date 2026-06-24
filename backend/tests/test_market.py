from __future__ import annotations

from fastapi.testclient import TestClient

from app.features.market import router as market_router


class _FakeFastInfo:
    last_price = 105.0
    previous_close = 100.0


class _FakeTicker:
    def __init__(self, symbol: str) -> None:
        self.symbol = symbol
        self.fast_info = _FakeFastInfo()


def test_market_snapshot_accepts_custom_watchlist_symbols(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(market_router.yf, "Ticker", _FakeTicker)

    response = client.get(
        "/api/v1/market/snapshot",
        params=[("symbols", "aapl"), ("symbols", "msft"), ("symbols", "AAPL")],
    )

    assert response.status_code == 200
    body = response.json()
    assert [quote["symbol"] for quote in body] == ["AAPL", "MSFT"]
    assert body[0]["price"] == 105.0
    assert body[0]["change"] == 5.0
    assert body[0]["changePercent"] == 5.0


def test_market_snapshot_rejects_invalid_symbol(client: TestClient) -> None:
    response = client.get(
        "/api/v1/market/snapshot",
        params={"symbols": "../bad"},
    )

    assert response.status_code == 422
