from __future__ import annotations

import datetime

from fastapi.testclient import TestClient
import pytest

from app.core.config import settings
from app.features.auth import router as auth_router
from app.features.auth import service as auth_service


def test_register_creates_account(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "trump",
            "email": "trump@example.com",
            "password": "StrongPass1!",
            "base_currency": "sgd",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body == {
        "verification_required": False,
        "message": "Account created.",
        "expires_in_seconds": None,
        "resend_available_in_seconds": None,
    }


def test_login_returns_bearer_token(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "trump",
            "email": "trump@example.com",
            "password": "StrongPass1!",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "trump@example.com",
            "password": "StrongPass1!",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    set_cookie = response.headers["set-cookie"].lower()
    assert "plutus_access_token=" in set_cookie
    assert "httponly" in set_cookie
    assert "samesite=lax" in set_cookie


def test_current_user_returns_authenticated_user(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "trump",
            "email": "trump@example.com",
            "password": "StrongPass1!",
        },
    )
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "trump@example.com",
            "password": "StrongPass1!",
        },
    )
    access_token = login_response.json()["access_token"]

    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "trump"
    assert body["email"] == "trump@example.com"
    assert "hashed_password" not in body


def test_current_user_accepts_auth_cookie(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "trump",
            "email": "trump@example.com",
            "password": "StrongPass1!",
        },
    )
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "trump@example.com",
            "password": "StrongPass1!",
        },
    )
    assert login_response.status_code == 200

    response = client.get("/api/v1/users/me")

    assert response.status_code == 200
    assert response.json()["username"] == "trump"


def test_logout_clears_auth_cookie(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "trump",
            "email": "trump@example.com",
            "password": "StrongPass1!",
        },
    )
    client.post(
        "/api/v1/auth/login",
        json={
            "email": "trump@example.com",
            "password": "StrongPass1!",
        },
    )

    logout_response = client.post("/api/v1/auth/logout")
    assert logout_response.status_code == 200
    assert logout_response.json() == {"authenticated": False}

    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_current_user_rejects_missing_token(client: TestClient) -> None:
    response = client.get("/api/v1/users/me")

    assert response.status_code == 401


def test_duplicate_email_is_rejected(client: TestClient) -> None:
    payload = {
        "username": "trump",
        "email": "trump@example.com",
        "password": "StrongPass1!",
    }

    assert client.post("/api/v1/auth/register", json=payload).status_code == 201

    response = client.post(
        "/api/v1/auth/register",
        json={**payload, "username": "donald"},
    )

    assert response.status_code == 409


def test_duplicate_username_is_rejected(client: TestClient) -> None:
    payload = {
        "username": "trump",
        "email": "trump@example.com",
        "password": "StrongPass1!",
    }

    assert client.post("/api/v1/auth/register", json=payload).status_code == 201

    response = client.post(
        "/api/v1/auth/register",
        json={**payload, "email": "donald@example.com"},
    )

    assert response.status_code == 409


def test_weak_password_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "trump",
            "email": "trump@example.com",
            "password": "password",
        },
    )

    assert response.status_code == 422


def test_wrong_password_is_rejected(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "trump",
            "email": "trump@example.com",
            "password": "StrongPass1!",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "trump@example.com",
            "password": "WrongPass1!",
        },
    )

    assert response.status_code == 401


@pytest.fixture()
def verification_outbox(monkeypatch: pytest.MonkeyPatch) -> list[tuple[str, str]]:
    sent: list[tuple[str, str]] = []
    monkeypatch.setattr(settings, "email_verification_required", True)
    monkeypatch.setattr(
        auth_router,
        "send_verification_code_email",
        lambda *, recipient, code: sent.append((recipient, code)),
    )
    return sent


def _register_pending_user(client: TestClient) -> dict[str, str]:
    payload = {
        "username": "pending-user",
        "email": "pending@example.com",
        "password": "StrongPass1!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    assert response.json()["verification_required"] is True
    return payload


def test_registration_requires_emailed_code_before_login(
    client: TestClient,
    verification_outbox: list[tuple[str, str]],
) -> None:
    payload = _register_pending_user(client)
    assert len(verification_outbox) == 1
    recipient, code = verification_outbox[0]
    assert recipient == payload["email"]
    assert len(code) == 6
    assert code.isdigit()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert login_response.status_code == 403
    assert login_response.json()["detail"] == "Verify your email before signing in."

    verify_response = client.post(
        "/api/v1/auth/verify-email",
        json={"email": payload["email"], "code": code},
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["access_token"]
    assert "plutus_access_token=" in verify_response.headers["set-cookie"]

    me_response = client.get("/api/v1/users/me")
    assert me_response.status_code == 200
    assert me_response.json()["is_verified"] is True

    replay_response = client.post(
        "/api/v1/auth/verify-email",
        json={"email": payload["email"], "code": code},
    )
    assert replay_response.status_code == 400


def test_verification_code_locks_after_five_failed_attempts(
    client: TestClient,
    verification_outbox: list[tuple[str, str]],
) -> None:
    payload = _register_pending_user(client)
    real_code = verification_outbox[0][1]
    wrong_code = "000000" if real_code != "000000" else "000001"

    for _ in range(5):
        response = client.post(
            "/api/v1/auth/verify-email",
            json={"email": payload["email"], "code": wrong_code},
        )
        assert response.status_code == 400

    locked_response = client.post(
        "/api/v1/auth/verify-email",
        json={"email": payload["email"], "code": real_code},
    )
    assert locked_response.status_code == 400


def test_verification_code_expires_after_ten_minutes(
    client: TestClient,
    verification_outbox: list[tuple[str, str]],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = _register_pending_user(client)
    code = verification_outbox[0][1]
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=11)
    monkeypatch.setattr(auth_service, "_now", lambda: future)

    response = client.post(
        "/api/v1/auth/verify-email",
        json={"email": payload["email"], "code": code},
    )
    assert response.status_code == 400


def test_resend_obeys_cooldown_and_invalidates_previous_code(
    client: TestClient,
    verification_outbox: list[tuple[str, str]],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = _register_pending_user(client)
    first_code = verification_outbox[0][1]

    cooldown_response = client.post(
        "/api/v1/auth/verification-code/resend",
        json={"email": payload["email"]},
    )
    assert cooldown_response.status_code == 202
    assert len(verification_outbox) == 1

    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=61)
    monkeypatch.setattr(auth_service, "_now", lambda: future)
    resend_response = client.post(
        "/api/v1/auth/verification-code/resend",
        json={"email": payload["email"]},
    )
    assert resend_response.status_code == 202
    assert len(verification_outbox) == 2
    second_code = verification_outbox[1][1]

    old_code_response = client.post(
        "/api/v1/auth/verify-email",
        json={"email": payload["email"], "code": first_code},
    )
    assert old_code_response.status_code == 400

    new_code_response = client.post(
        "/api/v1/auth/verify-email",
        json={"email": payload["email"], "code": second_code},
    )
    assert new_code_response.status_code == 200
