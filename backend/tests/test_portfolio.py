from __future__ import annotations

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


def _create_asset(
    client: TestClient,
    token: str,
    *,
    name: str = "Apple Inc.",
    category: str = "stocks",
    value: float = 10000.0,
    cost_basis: float | None = 8000.0,
    liquidity: str = "high",
    risk: str = "moderate",
    custom_category: str | None = None,
    notes: str | None = None,
) -> dict[str, object]:
    response = client.post(
        "/api/v1/portfolio/assets",
        headers=_auth_headers(token),
        json={
            "name": name,
            "category": category,
            "value": value,
            "cost_basis": cost_basis,
            "liquidity": liquidity,
            "risk": risk,
            "custom_category": custom_category,
            "notes": notes,
        },
    )
    assert response.status_code == 201
    return dict(response.json())


def _create_liability(
    client: TestClient,
    token: str,
    *,
    name: str = "Home Mortgage",
    category: str = "mortgage",
    balance: float = 250000.0,
    original_amount: float | None = 300000.0,
    interest_rate: float | None = 3.5,
    monthly_payment: float | None = 1500.0,
    custom_category: str | None = None,
    notes: str | None = None,
) -> dict[str, object]:
    response = client.post(
        "/api/v1/portfolio/liabilities",
        headers=_auth_headers(token),
        json={
            "name": name,
            "category": category,
            "balance": balance,
            "original_amount": original_amount,
            "interest_rate": interest_rate,
            "monthly_payment": monthly_payment,
            "custom_category": custom_category,
            "notes": notes,
        },
    )
    assert response.status_code == 201
    return dict(response.json())


# ── Asset tests ───────────────────────────────────────────────────────────────

def test_create_and_list_asset_for_current_user(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    _create_asset(client, token, name="Apple Inc.", value=10000.0)

    response = client.get(
        "/api/v1/portfolio/assets",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["name"] == "Apple Inc."
    assert body[0]["category"] == "stocks"
    assert float(body[0]["value"]) == 10000.0


def test_assets_are_scoped_to_current_user(client: TestClient) -> None:
    first_token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )
    second_token = _register_and_login(
        client,
        username="portfolio-viewer",
        email="portfolio-viewer@example.com",
    )

    _create_asset(client, first_token, name="Private holding")

    response = client.get(
        "/api/v1/portfolio/assets",
        headers=_auth_headers(second_token),
    )

    assert response.status_code == 200
    assert response.json() == []


def test_update_asset(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    asset = _create_asset(client, token, name="Apple Inc.", value=10000.0)

    response = client.patch(
        f"/api/v1/portfolio/assets/{asset['id']}",
        headers=_auth_headers(token),
        json={"value": 12000.0, "notes": "Rebalanced position"},
    )

    assert response.status_code == 200
    body = response.json()
    assert float(body["value"]) == 12000.0
    assert body["notes"] == "Rebalanced position"
    assert body["name"] == "Apple Inc."


def test_update_asset_category(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    asset = _create_asset(client, token, name="Gold ETF", category="stocks")

    response = client.patch(
        f"/api/v1/portfolio/assets/{asset['id']}",
        headers=_auth_headers(token),
        json={"category": "commodities"},
    )

    assert response.status_code == 200
    assert response.json()["category"] == "commodities"


def test_delete_asset(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    asset = _create_asset(client, token)

    delete_response = client.delete(
        f"/api/v1/portfolio/assets/{asset['id']}",
        headers=_auth_headers(token),
    )
    assert delete_response.status_code == 204

    response = client.get(
        "/api/v1/portfolio/assets",
        headers=_auth_headers(token),
    )
    assert response.status_code == 200
    assert response.json() == []


def test_delete_asset_of_another_user_returns_404(client: TestClient) -> None:
    owner_token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )
    attacker_token = _register_and_login(
        client,
        username="portfolio-attacker",
        email="portfolio-attacker@example.com",
    )

    asset = _create_asset(client, owner_token)

    response = client.delete(
        f"/api/v1/portfolio/assets/{asset['id']}",
        headers=_auth_headers(attacker_token),
    )
    assert response.status_code == 404


def test_update_asset_of_another_user_returns_404(client: TestClient) -> None:
    owner_token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )
    attacker_token = _register_and_login(
        client,
        username="portfolio-attacker",
        email="portfolio-attacker@example.com",
    )

    asset = _create_asset(client, owner_token)

    response = client.patch(
        f"/api/v1/portfolio/assets/{asset['id']}",
        headers=_auth_headers(attacker_token),
        json={"value": 1.0},
    )
    assert response.status_code == 404


def test_create_asset_with_custom_category(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    asset = _create_asset(
        client,
        token,
        name="Rare watches",
        category="other",
        custom_category="Collectibles",
    )

    assert asset["category"] == "other"
    assert asset["custom_category"] == "Collectibles"


def test_custom_category_cleared_for_non_other_category(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    # custom_category should be silently ignored for non-other categories
    asset = _create_asset(
        client,
        token,
        name="Apple Inc.",
        category="stocks",
        custom_category="Should be cleared",
    )

    assert asset["custom_category"] is None


def test_asset_rejects_invalid_category(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    response = client.post(
        "/api/v1/portfolio/assets",
        headers=_auth_headers(token),
        json={
            "name": "Mystery asset",
            "category": "unicorn",
            "value": 1000.0,
            "liquidity": "high",
            "risk": "low",
        },
    )
    assert response.status_code == 422


def test_asset_rejects_non_positive_value(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    response = client.post(
        "/api/v1/portfolio/assets",
        headers=_auth_headers(token),
        json={
            "name": "Zero value asset",
            "category": "cash",
            "value": 0,
            "liquidity": "high",
            "risk": "low",
        },
    )
    assert response.status_code == 422


def test_portfolio_assets_require_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/portfolio/assets")
    assert response.status_code == 401


# ── Liability tests ───────────────────────────────────────────────────────────

def test_create_and_list_liability_for_current_user(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    _create_liability(client, token, name="Home Mortgage", balance=250000.0)

    response = client.get(
        "/api/v1/portfolio/liabilities",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["name"] == "Home Mortgage"
    assert body[0]["category"] == "mortgage"
    assert float(body[0]["balance"]) == 250000.0


def test_liabilities_are_scoped_to_current_user(client: TestClient) -> None:
    first_token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )
    second_token = _register_and_login(
        client,
        username="portfolio-viewer",
        email="portfolio-viewer@example.com",
    )

    _create_liability(client, first_token, name="Private loan")

    response = client.get(
        "/api/v1/portfolio/liabilities",
        headers=_auth_headers(second_token),
    )

    assert response.status_code == 200
    assert response.json() == []


def test_update_liability(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    liability = _create_liability(client, token, balance=250000.0)

    response = client.patch(
        f"/api/v1/portfolio/liabilities/{liability['id']}",
        headers=_auth_headers(token),
        json={"balance": 240000.0, "notes": "Made extra payment"},
    )

    assert response.status_code == 200
    body = response.json()
    assert float(body["balance"]) == 240000.0
    assert body["notes"] == "Made extra payment"
    assert body["name"] == "Home Mortgage"


def test_update_liability_interest_rate(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    liability = _create_liability(client, token, interest_rate=3.5)

    response = client.patch(
        f"/api/v1/portfolio/liabilities/{liability['id']}",
        headers=_auth_headers(token),
        json={"interest_rate": 2.9},
    )

    assert response.status_code == 200
    assert float(response.json()["interest_rate"]) == 2.9


def test_delete_liability(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    liability = _create_liability(client, token)

    delete_response = client.delete(
        f"/api/v1/portfolio/liabilities/{liability['id']}",
        headers=_auth_headers(token),
    )
    assert delete_response.status_code == 204

    response = client.get(
        "/api/v1/portfolio/liabilities",
        headers=_auth_headers(token),
    )
    assert response.status_code == 200
    assert response.json() == []


def test_delete_liability_of_another_user_returns_404(client: TestClient) -> None:
    owner_token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )
    attacker_token = _register_and_login(
        client,
        username="portfolio-attacker",
        email="portfolio-attacker@example.com",
    )

    liability = _create_liability(client, owner_token)

    response = client.delete(
        f"/api/v1/portfolio/liabilities/{liability['id']}",
        headers=_auth_headers(attacker_token),
    )
    assert response.status_code == 404


def test_update_liability_of_another_user_returns_404(client: TestClient) -> None:
    owner_token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )
    attacker_token = _register_and_login(
        client,
        username="portfolio-attacker",
        email="portfolio-attacker@example.com",
    )

    liability = _create_liability(client, owner_token)

    response = client.patch(
        f"/api/v1/portfolio/liabilities/{liability['id']}",
        headers=_auth_headers(attacker_token),
        json={"balance": 1.0},
    )
    assert response.status_code == 404


def test_create_liability_with_custom_category(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    liability = _create_liability(
        client,
        token,
        name="Family loan",
        category="other",
        custom_category="Informal Loans",
    )

    assert liability["category"] == "other"
    assert liability["custom_category"] == "Informal Loans"


def test_custom_category_cleared_for_non_other_liability_category(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    liability = _create_liability(
        client,
        token,
        name="Car loan",
        category="auto_loan",
        custom_category="Should be cleared",
    )

    assert liability["custom_category"] is None


def test_liability_rejects_invalid_category(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    response = client.post(
        "/api/v1/portfolio/liabilities",
        headers=_auth_headers(token),
        json={
            "name": "Mystery debt",
            "category": "unknown_debt",
            "balance": 1000.0,
        },
    )
    assert response.status_code == 422


def test_liability_rejects_non_positive_balance(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    response = client.post(
        "/api/v1/portfolio/liabilities",
        headers=_auth_headers(token),
        json={
            "name": "Zero balance liability",
            "category": "credit_card",
            "balance": 0,
        },
    )
    assert response.status_code == 422


def test_liability_rejects_negative_interest_rate(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    response = client.post(
        "/api/v1/portfolio/liabilities",
        headers=_auth_headers(token),
        json={
            "name": "Bad rate loan",
            "category": "personal_loan",
            "balance": 5000.0,
            "interest_rate": -1.0,
        },
    )
    assert response.status_code == 422


def test_portfolio_liabilities_require_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/portfolio/liabilities")
    assert response.status_code == 401


# ── Cross-entity tests ────────────────────────────────────────────────────────

def test_user_can_have_both_assets_and_liabilities(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    _create_asset(client, token, name="Stock portfolio", value=50000.0)
    _create_liability(client, token, name="Mortgage", balance=200000.0)

    assets_response = client.get(
        "/api/v1/portfolio/assets",
        headers=_auth_headers(token),
    )
    liabilities_response = client.get(
        "/api/v1/portfolio/liabilities",
        headers=_auth_headers(token),
    )

    assert len(assets_response.json()) == 1
    assert len(liabilities_response.json()) == 1


def test_multiple_assets_across_categories(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    _create_asset(client, token, name="Apple Inc.", category="stocks", value=10000.0)
    _create_asset(client, token, name="US Treasury Bond", category="bonds", value=5000.0)
    _create_asset(client, token, name="Savings account", category="cash", value=20000.0)

    response = client.get(
        "/api/v1/portfolio/assets",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    assert len(response.json()) == 3
    categories = {item["category"] for item in response.json()}
    assert categories == {"stocks", "bonds", "cash"}


def test_multiple_custom_category_assets_grouped_correctly(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="portfolio-owner",
        email="portfolio-owner@example.com",
    )

    _create_asset(
        client, token,
        name="Rolex Daytona",
        category="other",
        custom_category="Collectibles",
        value=15000.0,
    )
    _create_asset(
        client, token,
        name="Vintage Porsche",
        category="other",
        custom_category="Collectibles",
        value=80000.0,
    )
    _create_asset(
        client, token,
        name="Angel deal — Series A",
        category="other",
        custom_category="Angel Investments",
        value=25000.0,
    )

    response = client.get(
        "/api/v1/portfolio/assets",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 3

    collectibles = [a for a in body if a["custom_category"] == "Collectibles"]
    angel = [a for a in body if a["custom_category"] == "Angel Investments"]
    assert len(collectibles) == 2
    assert len(angel) == 1