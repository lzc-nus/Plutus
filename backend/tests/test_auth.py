from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.db.init_db import import_models
from app.db.session import get_db
from app.main import app


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    import_models()

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def override_get_db() -> Generator[Session, None, None]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    SQLModel.metadata.drop_all(engine)


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
