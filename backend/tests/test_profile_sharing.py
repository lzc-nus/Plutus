from __future__ import annotations

from urllib.parse import urlparse

from fastapi.testclient import TestClient


def _register_and_login(client: TestClient, *, username: str, email: str) -> str:
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "StrongPass1!",
        },
    )
    assert register_response.status_code == 201
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPass1!"},
    )
    assert login_response.status_code == 200
    return str(login_response.json()["access_token"])


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _share_path(response_body: dict[str, object]) -> str:
    share_url = str(response_body["share_url"])
    parsed = urlparse(share_url)
    assert parsed.path.startswith("/share/")
    token = parsed.path.removeprefix("/share/")
    assert len(token) >= 40
    return f"/api/v1/profile-share/{token}"


def test_profile_share_management_requires_authentication(client: TestClient) -> None:
    assert client.get("/api/v1/profile-share/status").status_code == 401
    assert client.post("/api/v1/profile-share").status_code == 401
    assert client.delete("/api/v1/profile-share").status_code == 401


def test_create_share_exposes_aggregates_without_private_records(
    client: TestClient,
) -> None:
    token = _register_and_login(
        client,
        username="sharing-owner",
        email="sharing-owner@example.com",
    )
    headers = _headers(token)
    client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"display_name": "Sharing Owner", "bio": "Long-term investor"},
    )
    asset_response = client.post(
        "/api/v1/portfolio/assets",
        headers=headers,
        json={
            "name": "Private brokerage account",
            "category": "stocks",
            "value": 75000,
            "cost_basis": 50000,
            "liquidity": "high",
            "risk": "moderate",
            "notes": "Never expose this note",
        },
    )
    assert asset_response.status_code == 201
    second_asset_response = client.post(
        "/api/v1/portfolio/assets",
        headers=headers,
        json={
            "name": "Emergency fund",
            "category": "cash",
            "value": 25000,
            "liquidity": "high",
            "risk": "low",
        },
    )
    assert second_asset_response.status_code == 201
    liability_response = client.post(
        "/api/v1/portfolio/liabilities",
        headers=headers,
        json={
            "name": "Private mortgage account",
            "category": "mortgage",
            "balance": 40000,
            "interest_rate": 3.25,
            "notes": "Never expose this liability note",
        },
    )
    assert liability_response.status_code == 201

    status_response = client.get("/api/v1/profile-share/status", headers=headers)
    assert status_response.status_code == 200
    assert status_response.json() == {
        "enabled": False,
        "created_at": None,
        "updated_at": None,
    }

    create_response = client.post("/api/v1/profile-share", headers=headers)
    assert create_response.status_code == 201
    assert "token" not in create_response.json()

    public_response = client.get(_share_path(create_response.json()))
    assert public_response.status_code == 200
    body = public_response.json()
    assert body["username"] == "sharing-owner"
    assert body["display_name"] == "Sharing Owner"
    assert float(body["total_assets"]) == 100000
    assert float(body["total_liabilities"]) == 40000
    assert float(body["net_worth"]) == 60000
    assert body["asset_count"] == 2
    assert body["liability_count"] == 1
    assert body["asset_allocation"] == [
        {"category": "stocks", "value": "75000.00", "share_percent": "75.0"},
        {"category": "cash", "value": "25000.00", "share_percent": "25.0"},
    ]

    serialized = public_response.text
    for private_value in (
        "sharing-owner@example.com",
        "Private brokerage account",
        "Private mortgage account",
        "Never expose this note",
        "Never expose this liability note",
        "cost_basis",
        "interest_rate",
    ):
        assert private_value not in serialized

    enabled_status = client.get("/api/v1/profile-share/status", headers=headers)
    assert enabled_status.status_code == 200
    assert enabled_status.json()["enabled"] is True
    assert enabled_status.json()["created_at"] is not None


def test_rotating_and_revoking_share_invalidates_old_links(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="rotating-owner",
        email="rotating-owner@example.com",
    )
    headers = _headers(token)

    first_response = client.post("/api/v1/profile-share", headers=headers)
    first_path = _share_path(first_response.json())
    assert client.get(first_path).status_code == 200

    second_response = client.post("/api/v1/profile-share", headers=headers)
    second_path = _share_path(second_response.json())
    assert second_path != first_path
    assert client.get(first_path).status_code == 404
    assert client.get(second_path).status_code == 200

    revoke_response = client.delete("/api/v1/profile-share", headers=headers)
    assert revoke_response.status_code == 204
    assert client.get(second_path).status_code == 404
    assert client.delete("/api/v1/profile-share", headers=headers).status_code == 204


def test_shared_profile_is_scoped_to_its_owner(client: TestClient) -> None:
    owner_token = _register_and_login(
        client,
        username="profile-owner",
        email="profile-owner@example.com",
    )
    other_token = _register_and_login(
        client,
        username="other-owner",
        email="other-owner@example.com",
    )
    client.post(
        "/api/v1/portfolio/assets",
        headers=_headers(owner_token),
        json={
            "name": "Owner asset",
            "category": "cash",
            "value": 100,
            "liquidity": "high",
            "risk": "low",
        },
    )
    client.post(
        "/api/v1/portfolio/assets",
        headers=_headers(other_token),
        json={
            "name": "Other user's asset",
            "category": "crypto",
            "value": 999999,
            "liquidity": "high",
            "risk": "very_high",
        },
    )

    share_response = client.post(
        "/api/v1/profile-share",
        headers=_headers(owner_token),
    )
    public_response = client.get(_share_path(share_response.json()))

    assert public_response.status_code == 200
    assert float(public_response.json()["total_assets"]) == 100
    assert "Other user's asset" not in public_response.text


def test_deleting_account_invalidates_its_share_link(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="departing-owner",
        email="departing-owner@example.com",
    )
    headers = _headers(token)
    share_response = client.post("/api/v1/profile-share", headers=headers)
    share_path = _share_path(share_response.json())
    assert client.get(share_path).status_code == 200

    delete_response = client.request(
        "DELETE",
        "/api/v1/users/me",
        headers=headers,
        json={"password": "StrongPass1!"},
    )

    assert delete_response.status_code == 204
    assert client.get(share_path).status_code == 404
