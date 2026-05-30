from __future__ import annotations

import datetime
from decimal import Decimal

from fastapi.testclient import TestClient


def _register_and_login(client: TestClient, *, username: str, email: str) -> str:
    client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "StrongPass1!",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPass1!"},
    )
    return str(response.json()["access_token"])


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_create_transaction_for_current_user(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="trump",
        email="trump@example.com",
    )

    response = client.post(
        "/api/v1/transactions",
        headers=_auth_headers(token),
        json={
            "occurred_at": "2026-05-15T10:30:00+00:00",
            "description": "ETF purchase",
            "category": "Investment",
            "account": "Brokerage",
            "amount": "-2400.50",
            "impact": "Diversification",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["description"] == "ETF purchase"
    assert body["category"] == "Investment"
    assert Decimal(str(body["amount"])) == Decimal("-2400.50")
    assert "user_id" not in body


def test_list_transactions_returns_only_current_users_records(
    client: TestClient,
) -> None:
    first_token = _register_and_login(
        client,
        username="trump",
        email="trump@example.com",
    )
    second_token = _register_and_login(
        client,
        username="donald",
        email="donald@example.com",
    )

    client.post(
        "/api/v1/transactions",
        headers=_auth_headers(first_token),
        json={
            "occurred_at": "2026-05-15T10:30:00+00:00",
            "description": "Salary credited",
            "category": "Income",
            "account": "Operating cash",
            "amount": "8500.00",
            "impact": "Positive cashflow",
        },
    )
    client.post(
        "/api/v1/transactions",
        headers=_auth_headers(second_token),
        json={
            "occurred_at": "2026-05-16T10:30:00+00:00",
            "description": "Private record",
            "category": "Income",
            "account": "Operating cash",
            "amount": "1200.00",
            "impact": "Private cashflow",
        },
    )

    response = client.get(
        "/api/v1/transactions",
        headers=_auth_headers(first_token),
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["description"] == "Salary credited"


def test_transactions_range_filter(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="trump",
        email="trump@example.com",
    )
    now = datetime.datetime.now(datetime.timezone.utc)
    old = now - datetime.timedelta(days=2)

    client.post(
        "/api/v1/transactions",
        headers=_auth_headers(token),
        json={
            "occurred_at": old.isoformat(),
            "description": "Older movement",
            "category": "Expense",
            "account": "Operating cash",
            "amount": "-25.00",
            "impact": "Outside daily view",
        },
    )
    client.post(
        "/api/v1/transactions",
        headers=_auth_headers(token),
        json={
            "occurred_at": now.isoformat(),
            "description": "Current movement",
            "category": "Expense",
            "account": "Operating cash",
            "amount": "-15.00",
            "impact": "Inside daily view",
        },
    )

    response = client.get(
        "/api/v1/transactions?range=1D",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["description"] == "Current movement"


def test_transactions_all_range_returns_full_ledger(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="trump",
        email="trump@example.com",
    )
    now = datetime.datetime.now(datetime.timezone.utc)
    old = now - datetime.timedelta(days=730)

    client.post(
        "/api/v1/transactions",
        headers=_auth_headers(token),
        json={
            "occurred_at": old.isoformat(),
            "description": "Historic investment",
            "category": "Investment",
            "account": "Brokerage",
            "amount": "1000.00",
            "impact": "Two years ago",
        },
    )
    client.post(
        "/api/v1/transactions",
        headers=_auth_headers(token),
        json={
            "occurred_at": now.isoformat(),
            "description": "Current investment",
            "category": "Investment",
            "account": "Brokerage",
            "amount": "500.00",
            "impact": "Current period",
        },
    )

    response = client.get(
        "/api/v1/transactions?range=ALL",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert [transaction["description"] for transaction in body] == [
        "Current investment",
        "Historic investment",
    ]


def test_transactions_require_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/transactions")

    assert response.status_code == 401
