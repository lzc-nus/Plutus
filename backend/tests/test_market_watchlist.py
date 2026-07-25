from __future__ import annotations

from fastapi.testclient import TestClient


# ── Helpers ───────────────────────────────────────────────────────────────────

def _register_and_login(client: TestClient, *, username: str, email: str) -> str:
    client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": "StrongPass1!"},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPass1!"},
    )
    return str(response.json()["access_token"])


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ── GET /market/watchlist ─────────────────────────────────────────────────────

def test_get_watchlist_returns_defaults_on_first_access(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )

    response = client.get("/api/v1/market/watchlist", headers=_auth_headers(token))

    assert response.status_code == 200
    body = response.json()
    assert "symbols" in body
    assert len(body["symbols"]) > 0
    # Default symbols should be present
    assert "SPY" in body["symbols"]


def test_get_watchlist_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/market/watchlist")

    assert response.status_code == 401


# ── POST /market/watchlist/symbols ────────────────────────────────────────────

def test_add_symbol_to_watchlist(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )

    response = client.post(
        "/api/v1/market/watchlist/symbols",
        headers=_auth_headers(token),
        json={"symbol": "AAPL"},
    )

    assert response.status_code == 201
    assert "AAPL" in response.json()["symbols"]


def test_add_symbol_normalises_to_uppercase(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )

    response = client.post(
        "/api/v1/market/watchlist/symbols",
        headers=_auth_headers(token),
        json={"symbol": "aapl"},
    )

    assert response.status_code == 201
    assert "AAPL" in response.json()["symbols"]
    assert "aapl" not in response.json()["symbols"]


def test_add_duplicate_symbol_returns_409(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )
    client.post(
        "/api/v1/market/watchlist/symbols",
        headers=_auth_headers(token),
        json={"symbol": "AAPL"},
    )

    response = client.post(
        "/api/v1/market/watchlist/symbols",
        headers=_auth_headers(token),
        json={"symbol": "AAPL"},
    )

    assert response.status_code == 409


def test_add_symbol_requires_authentication(client: TestClient) -> None:
    response = client.post(
        "/api/v1/market/watchlist/symbols",
        json={"symbol": "AAPL"},
    )

    assert response.status_code == 401


def test_add_symbol_exceeding_limit_returns_409(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )
    # Fill up to the limit with unique symbols
    client.put(
        "/api/v1/market/watchlist",
        headers=_auth_headers(token),
        json={"symbols": [f"SYM{i}" for i in range(20)]},
    )

    response = client.post(
        "/api/v1/market/watchlist/symbols",
        headers=_auth_headers(token),
        json={"symbol": "EXTRA"},
    )

    assert response.status_code == 409


# ── DELETE /market/watchlist/symbols/{symbol} ─────────────────────────────────

def test_remove_symbol_from_watchlist(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )
    client.post(
        "/api/v1/market/watchlist/symbols",
        headers=_auth_headers(token),
        json={"symbol": "AAPL"},
    )

    response = client.delete(
        "/api/v1/market/watchlist/symbols/AAPL",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    assert "AAPL" not in response.json()["symbols"]


def test_remove_symbol_normalises_to_uppercase(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )
    client.post(
        "/api/v1/market/watchlist/symbols",
        headers=_auth_headers(token),
        json={"symbol": "AAPL"},
    )

    response = client.delete(
        "/api/v1/market/watchlist/symbols/aapl",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    assert "AAPL" not in response.json()["symbols"]


def test_remove_nonexistent_symbol_returns_404(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )

    response = client.delete(
        "/api/v1/market/watchlist/symbols/NOTEXIST",
        headers=_auth_headers(token),
    )

    assert response.status_code == 404


def test_remove_symbol_requires_authentication(client: TestClient) -> None:
    response = client.delete("/api/v1/market/watchlist/symbols/AAPL")

    assert response.status_code == 401


# ── PUT /market/watchlist ─────────────────────────────────────────────────────

def test_set_watchlist_replaces_entire_list(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )
    client.post(
        "/api/v1/market/watchlist/symbols",
        headers=_auth_headers(token),
        json={"symbol": "AAPL"},
    )

    response = client.put(
        "/api/v1/market/watchlist",
        headers=_auth_headers(token),
        json={"symbols": ["MSFT", "GOOG"]},
    )

    assert response.status_code == 200
    symbols = response.json()["symbols"]
    assert symbols == ["MSFT", "GOOG"]
    assert "AAPL" not in symbols


def test_set_watchlist_deduplicates_symbols(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )

    response = client.put(
        "/api/v1/market/watchlist",
        headers=_auth_headers(token),
        json={"symbols": ["AAPL", "AAPL", "MSFT", "MSFT"]},
    )

    assert response.status_code == 200
    symbols = response.json()["symbols"]
    assert symbols.count("AAPL") == 1
    assert symbols.count("MSFT") == 1


def test_set_watchlist_normalises_to_uppercase(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )

    response = client.put(
        "/api/v1/market/watchlist",
        headers=_auth_headers(token),
        json={"symbols": ["aapl", "msft"]},
    )

    assert response.status_code == 200
    symbols = response.json()["symbols"]
    assert "AAPL" in symbols
    assert "MSFT" in symbols
    assert "aapl" not in symbols
    assert "msft" not in symbols


def test_set_watchlist_exceeding_limit_returns_422(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )

    response = client.put(
        "/api/v1/market/watchlist",
        headers=_auth_headers(token),
        json={"symbols": [f"SYM{i}" for i in range(21)]},
    )

    assert response.status_code == 422


def test_set_watchlist_requires_authentication(client: TestClient) -> None:
    response = client.put(
        "/api/v1/market/watchlist",
        json={"symbols": ["AAPL"]},
    )

    assert response.status_code == 401


# ── Scoping ───────────────────────────────────────────────────────────────────

def test_watchlist_is_scoped_to_current_user(client: TestClient) -> None:
    token_a = _register_and_login(
        client, username="watchlist-user-a", email="watchlist-user-a@example.com"
    )
    token_b = _register_and_login(
        client, username="watchlist-user-b", email="watchlist-user-b@example.com"
    )

    # User A sets a custom watchlist
    client.put(
        "/api/v1/market/watchlist",
        headers=_auth_headers(token_a),
        json={"symbols": ["AAPL", "TSLA"]},
    )

    # User B should still have their own default watchlist
    response_b = client.get(
        "/api/v1/market/watchlist",
        headers=_auth_headers(token_b),
    )

    symbols_b = response_b.json()["symbols"]
    assert "AAPL" not in symbols_b or "TSLA" not in symbols_b or symbols_b != ["AAPL", "TSLA"]

    # User A's watchlist is unaffected by B
    response_a = client.get(
        "/api/v1/market/watchlist",
        headers=_auth_headers(token_a),
    )
    assert response_a.json()["symbols"] == ["AAPL", "TSLA"]


def test_watchlist_persists_across_requests(client: TestClient) -> None:
    token = _register_and_login(
        client, username="watchlist-user", email="watchlist-user@example.com"
    )

    client.put(
        "/api/v1/market/watchlist",
        headers=_auth_headers(token),
        json={"symbols": ["NVDA", "AMD"]},
    )

    response = client.get(
        "/api/v1/market/watchlist",
        headers=_auth_headers(token),
    )

    assert response.json()["symbols"] == ["NVDA", "AMD"]