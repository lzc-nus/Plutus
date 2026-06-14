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


# ── /users/me ─────────────────────────────────────────────────────────────────

def test_me_returns_authenticated_user(client: TestClient) -> None:
    token = _register_and_login(
        client, username="profile-user", email="profile-user@example.com"
    )

    response = client.get("/api/v1/users/me", headers=_auth_headers(token))

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "profile-user"
    assert body["email"] == "profile-user@example.com"
    assert "hashed_password" not in body


def test_me_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/users/me")

    assert response.status_code == 401


def test_me_does_not_expose_another_users_data(client: TestClient) -> None:
    token_a = _register_and_login(
        client, username="user-a", email="user-a@example.com"
    )
    _register_and_login(
        client, username="user-b", email="user-b@example.com"
    )

    response = client.get("/api/v1/users/me", headers=_auth_headers(token_a))

    assert response.json()["username"] == "user-a"


# ── PATCH /users/me ───────────────────────────────────────────────────────────

def test_update_profile_display_name_and_bio(client: TestClient) -> None:
    token = _register_and_login(
        client, username="profile-user", email="profile-user@example.com"
    )

    response = client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"display_name": "John Doe", "bio": "Value investor."},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["display_name"] == "John Doe"
    assert body["bio"] == "Value investor."


def test_update_profile_avatar_url(client: TestClient) -> None:
    token = _register_and_login(
        client, username="profile-user", email="profile-user@example.com"
    )

    response = client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"avatar_url": "https://example.com/avatar.png"},
    )

    assert response.status_code == 200
    assert response.json()["avatar_url"] == "https://example.com/avatar.png"


def test_update_profile_is_partial(client: TestClient) -> None:
    token = _register_and_login(
        client, username="profile-user", email="profile-user@example.com"
    )
    client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"display_name": "John Doe", "bio": "Value investor."},
    )

    # Update only bio — display_name should be preserved
    response = client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"bio": "Updated bio."},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["display_name"] == "John Doe"
    assert body["bio"] == "Updated bio."


def test_update_profile_bio_exceeding_max_length_returns_422(client: TestClient) -> None:
    token = _register_and_login(
        client, username="profile-user", email="profile-user@example.com"
    )

    response = client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"bio": "x" * 301},
    )

    assert response.status_code == 422


def test_update_profile_display_name_exceeding_max_length_returns_422(client: TestClient) -> None:
    token = _register_and_login(
        client, username="profile-user", email="profile-user@example.com"
    )

    response = client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"display_name": "x" * 101},
    )

    assert response.status_code == 422


def test_update_profile_strips_whitespace(client: TestClient) -> None:
    token = _register_and_login(
        client, username="profile-user", email="profile-user@example.com"
    )

    response = client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"display_name": "  John Doe  ", "bio": "  Value investor.  "},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["display_name"] == "John Doe"
    assert body["bio"] == "Value investor."


def test_update_profile_clears_field_with_null(client: TestClient) -> None:
    token = _register_and_login(
        client, username="profile-user", email="profile-user@example.com"
    )
    client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"bio": "Value investor."},
    )

    response = client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(token),
        json={"bio": None},
    )

    assert response.status_code == 200
    assert response.json()["bio"] is None


def test_update_profile_requires_authentication(client: TestClient) -> None:
    response = client.patch(
        "/api/v1/users/me",
        json={"display_name": "Ghost"},
    )

    assert response.status_code == 401


# ── GET /users/{user_id} ──────────────────────────────────────────────────────

def test_get_user_by_id_returns_public_profile(client: TestClient) -> None:
    target_token = _register_and_login(
        client, username="public-user", email="public-user@example.com"
    )
    viewer_token = _register_and_login(
        client, username="viewer", email="viewer@example.com"
    )
    client.patch(
        "/api/v1/users/me",
        headers=_auth_headers(target_token),
        json={"display_name": "Public User", "bio": "Visible to all."},
    )
    target_id = client.get(
        "/api/v1/users/me", headers=_auth_headers(target_token)
    ).json()["id"]

    response = client.get(
        f"/api/v1/users/{target_id}",
        headers=_auth_headers(viewer_token),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "public-user"
    assert body["display_name"] == "Public User"
    assert body["bio"] == "Visible to all."


def test_get_user_by_id_does_not_expose_email(client: TestClient) -> None:
    target_token = _register_and_login(
        client, username="public-user", email="public-user@example.com"
    )
    viewer_token = _register_and_login(
        client, username="viewer", email="viewer@example.com"
    )
    target_id = client.get(
        "/api/v1/users/me", headers=_auth_headers(target_token)
    ).json()["id"]

    response = client.get(
        f"/api/v1/users/{target_id}",
        headers=_auth_headers(viewer_token),
    )

    assert "email" not in response.json()


def test_get_user_by_id_nonexistent_returns_404(client: TestClient) -> None:
    token = _register_and_login(
        client, username="viewer", email="viewer@example.com"
    )
    fake_id = "00000000-0000-0000-0000-000000000000"

    response = client.get(
        f"/api/v1/users/{fake_id}",
        headers=_auth_headers(token),
    )

    assert response.status_code == 404


def test_get_user_by_id_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/users/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 401