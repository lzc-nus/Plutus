from __future__ import annotations

from fastapi.testclient import TestClient

from app.core.config import settings


def test_api_responses_include_security_and_cache_headers(client: TestClient) -> None:
    response = client.get("/api/v1/community/feed/global")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["cache-control"] == "no-store"


def test_production_rejects_cross_origin_cookie_state_change(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "allowed_origins", ["https://plutus.example"])
    client.cookies.set(settings.auth_cookie_name, "browser-token")

    response = client.post(
        "/api/v1/auth/logout",
        headers={"Origin": "https://attacker.example"},
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Request origin is not allowed."}


def test_production_accepts_trusted_origin_cookie_state_change(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "allowed_origins", ["https://plutus.example"])
    client.cookies.set(settings.auth_cookie_name, "browser-token")

    response = client.post(
        "/api/v1/auth/logout",
        headers={"Origin": "https://plutus.example"},
    )

    assert response.status_code == 200
