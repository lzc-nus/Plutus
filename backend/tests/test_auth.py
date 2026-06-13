from __future__ import annotations

from fastapi.testclient import TestClient


def test_register_creates_public_user(client: TestClient) -> None:
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
    assert body["username"] == "trump"
    assert body["email"] == "trump@example.com"
    assert body["base_currency"] == "SGD"
    assert "hashed_password" not in body


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
