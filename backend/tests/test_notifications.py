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


def _get_user_id(client: TestClient, token: str) -> str:
    return client.get("/api/v1/users/me", headers=_auth_headers(token)).json()["id"]


def _create_post(client: TestClient, token: str) -> dict:
    response = client.post(
        "/api/v1/community/posts",
        headers=_auth_headers(token),
        json={"content_blocks": [{"type": "text", "value": "Test post."}]},
    )
    return response.json()


def _create_comment(client: TestClient, token: str, post_id: str) -> dict:
    response = client.post(
        f"/api/v1/community/posts/{post_id}/comments",
        headers=_auth_headers(token),
        json={"content_blocks": [{"type": "text", "value": "Test comment."}]},
    )
    return response.json()


# ── GET /notifications ────────────────────────────────────────────────────────

def test_notifications_empty_on_new_account(client: TestClient) -> None:
    token = _register_and_login(
        client, username="notif-user", email="notif-user@example.com"
    )

    response = client.get("/api/v1/notifications", headers=_auth_headers(token))

    assert response.status_code == 200
    assert response.json() == []


def test_notifications_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/notifications")

    assert response.status_code == 401


# ── GET /notifications/unread_count ──────────────────────────────────────────

def test_unread_count_is_zero_on_new_account(client: TestClient) -> None:
    token = _register_and_login(
        client, username="notif-user", email="notif-user@example.com"
    )

    response = client.get(
        "/api/v1/notifications/unread_count", headers=_auth_headers(token)
    )

    assert response.status_code == 200
    assert response.json() == 0


def test_unread_count_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/notifications/unread_count")

    assert response.status_code == 401


# ── Follow notification ───────────────────────────────────────────────────────

def test_follow_creates_notification_for_followee(client: TestClient) -> None:
    follower_token = _register_and_login(
        client, username="notif-follower", email="notif-follower@example.com"
    )
    followee_token = _register_and_login(
        client, username="notif-followee", email="notif-followee@example.com"
    )
    followee_id = _get_user_id(client, followee_token)

    client.post(
        f"/api/v1/community/users/{followee_id}/follow",
        headers=_auth_headers(follower_token),
    )

    response = client.get(
        "/api/v1/notifications", headers=_auth_headers(followee_token)
    )

    assert response.status_code == 200
    notifications = response.json()
    assert len(notifications) == 1
    assert notifications[0]["type"] == "follow"
    assert notifications[0]["read"] is False


def test_follow_increments_unread_count(client: TestClient) -> None:
    follower_token = _register_and_login(
        client, username="notif-follower", email="notif-follower@example.com"
    )
    followee_token = _register_and_login(
        client, username="notif-followee", email="notif-followee@example.com"
    )
    followee_id = _get_user_id(client, followee_token)

    client.post(
        f"/api/v1/community/users/{followee_id}/follow",
        headers=_auth_headers(follower_token),
    )

    response = client.get(
        "/api/v1/notifications/unread_count", headers=_auth_headers(followee_token)
    )

    assert response.json() == 1


def test_self_follow_does_not_create_notification(client: TestClient) -> None:
    token = _register_and_login(
        client, username="notif-user", email="notif-user@example.com"
    )
    user_id = _get_user_id(client, token)

    # Self-follow is rejected at the community level, but even if it weren't,
    # no notification should be created for self-actions.
    client.post(
        f"/api/v1/community/users/{user_id}/follow",
        headers=_auth_headers(token),
    )

    response = client.get("/api/v1/notifications", headers=_auth_headers(token))
    assert response.json() == []


# ── Like post notification ────────────────────────────────────────────────────

def test_like_post_creates_notification_for_author(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="notif-author", email="notif-author@example.com"
    )
    liker_token = _register_and_login(
        client, username="notif-liker", email="notif-liker@example.com"
    )
    post = _create_post(client, author_token)

    client.post(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(liker_token),
    )

    response = client.get(
        "/api/v1/notifications", headers=_auth_headers(author_token)
    )

    notifications = response.json()
    assert len(notifications) == 1
    assert notifications[0]["type"] == "like_post"
    assert notifications[0]["post_id"] == post["id"]
    assert notifications[0]["read"] is False


def test_liking_own_post_does_not_create_notification(client: TestClient) -> None:
    token = _register_and_login(
        client, username="notif-user", email="notif-user@example.com"
    )
    post = _create_post(client, token)

    client.post(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(token),
    )

    response = client.get("/api/v1/notifications", headers=_auth_headers(token))
    assert response.json() == []


def test_duplicate_like_does_not_create_duplicate_notification(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="notif-author", email="notif-author@example.com"
    )
    liker_token = _register_and_login(
        client, username="notif-liker", email="notif-liker@example.com"
    )
    post = _create_post(client, author_token)

    client.post(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(liker_token),
    )
    # Unlike then re-like — should not create a second notification
    client.delete(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(liker_token),
    )
    client.post(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(liker_token),
    )

    response = client.get(
        "/api/v1/notifications", headers=_auth_headers(author_token)
    )
    assert len(response.json()) == 1


# ── Comment notification ──────────────────────────────────────────────────────

def test_comment_creates_notification_for_post_author(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="notif-author", email="notif-author@example.com"
    )
    commenter_token = _register_and_login(
        client, username="notif-commenter", email="notif-commenter@example.com"
    )
    post = _create_post(client, author_token)

    comment = _create_comment(client, commenter_token, post["id"])

    response = client.get(
        "/api/v1/notifications", headers=_auth_headers(author_token)
    )

    notifications = response.json()
    assert len(notifications) == 1
    assert notifications[0]["type"] == "comment"
    assert notifications[0]["post_id"] == post["id"]
    assert notifications[0]["comment_id"] == comment["id"]


def test_commenting_on_own_post_does_not_create_notification(client: TestClient) -> None:
    token = _register_and_login(
        client, username="notif-user", email="notif-user@example.com"
    )
    post = _create_post(client, token)

    _create_comment(client, token, post["id"])

    response = client.get("/api/v1/notifications", headers=_auth_headers(token))
    assert response.json() == []


# ── Repost notification ───────────────────────────────────────────────────────

def test_repost_creates_notification_for_original_author(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="notif-author", email="notif-author@example.com"
    )
    reposter_token = _register_and_login(
        client, username="notif-reposter", email="notif-reposter@example.com"
    )
    post = _create_post(client, author_token)

    client.post(
        f"/api/v1/community/posts/{post['id']}/repost",
        headers=_auth_headers(reposter_token),
        json={"content_blocks": []},
    )

    response = client.get(
        "/api/v1/notifications", headers=_auth_headers(author_token)
    )

    notifications = response.json()
    assert len(notifications) == 1
    assert notifications[0]["type"] == "repost"
    assert notifications[0]["post_id"] == post["id"]


# ── Like comment notification ─────────────────────────────────────────────────

def test_like_comment_creates_notification_for_comment_author(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="notif-author", email="notif-author@example.com"
    )
    commenter_token = _register_and_login(
        client, username="notif-commenter", email="notif-commenter@example.com"
    )
    liker_token = _register_and_login(
        client, username="notif-liker", email="notif-liker@example.com"
    )
    post = _create_post(client, author_token)
    comment = _create_comment(client, commenter_token, post["id"])

    client.post(
        f"/api/v1/community/posts/{post['id']}/comments/{comment['id']}/like",
        headers=_auth_headers(liker_token),
    )

    response = client.get(
        "/api/v1/notifications", headers=_auth_headers(commenter_token)
    )

    notifications = response.json()
    assert any(n["type"] == "like_comment" for n in notifications)
    like_notif = next(n for n in notifications if n["type"] == "like_comment")
    assert like_notif["comment_id"] == comment["id"]


# ── PATCH /notifications/read ─────────────────────────────────────────────────

def test_mark_all_read_clears_unread_count(client: TestClient) -> None:
    follower_token = _register_and_login(
        client, username="notif-follower", email="notif-follower@example.com"
    )
    followee_token = _register_and_login(
        client, username="notif-followee", email="notif-followee@example.com"
    )
    followee_id = _get_user_id(client, followee_token)

    client.post(
        f"/api/v1/community/users/{followee_id}/follow",
        headers=_auth_headers(follower_token),
    )

    client.patch(
        "/api/v1/notifications/read", headers=_auth_headers(followee_token)
    )

    response = client.get(
        "/api/v1/notifications/unread_count", headers=_auth_headers(followee_token)
    )
    assert response.json() == 0


def test_mark_all_read_sets_read_flag_on_all_notifications(client: TestClient) -> None:
    follower_token = _register_and_login(
        client, username="notif-follower", email="notif-follower@example.com"
    )
    followee_token = _register_and_login(
        client, username="notif-followee", email="notif-followee@example.com"
    )
    followee_id = _get_user_id(client, followee_token)
    post = _create_post(client, followee_token)

    client.post(
        f"/api/v1/community/users/{followee_id}/follow",
        headers=_auth_headers(follower_token),
    )
    client.post(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(follower_token),
    )

    client.patch(
        "/api/v1/notifications/read", headers=_auth_headers(followee_token)
    )

    response = client.get(
        "/api/v1/notifications", headers=_auth_headers(followee_token)
    )
    assert all(n["read"] is True for n in response.json())


def test_mark_all_read_requires_authentication(client: TestClient) -> None:
    response = client.patch("/api/v1/notifications/read")

    assert response.status_code == 401


# ── PATCH /notifications/{id}/read ───────────────────────────────────────────

def test_mark_one_read_marks_only_that_notification(client: TestClient) -> None:
    follower_token = _register_and_login(
        client, username="notif-follower", email="notif-follower@example.com"
    )
    followee_token = _register_and_login(
        client, username="notif-followee", email="notif-followee@example.com"
    )
    followee_id = _get_user_id(client, followee_token)
    post = _create_post(client, followee_token)

    client.post(
        f"/api/v1/community/users/{followee_id}/follow",
        headers=_auth_headers(follower_token),
    )
    client.post(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(follower_token),
    )

    notifications = client.get(
        "/api/v1/notifications", headers=_auth_headers(followee_token)
    ).json()
    assert len(notifications) == 2

    target_id = notifications[0]["id"]
    client.patch(
        f"/api/v1/notifications/{target_id}/read",
        headers=_auth_headers(followee_token),
    )

    updated = client.get(
        "/api/v1/notifications", headers=_auth_headers(followee_token)
    ).json()
    read_flags = {n["id"]: n["read"] for n in updated}
    assert read_flags[target_id] is True
    assert read_flags[notifications[1]["id"]] is False


def test_mark_one_read_nonexistent_returns_404(client: TestClient) -> None:
    token = _register_and_login(
        client, username="notif-user", email="notif-user@example.com"
    )
    fake_id = "00000000-0000-0000-0000-000000000000"

    response = client.patch(
        f"/api/v1/notifications/{fake_id}/read",
        headers=_auth_headers(token),
    )

    assert response.status_code == 404


def test_mark_one_read_requires_authentication(client: TestClient) -> None:
    fake_id = "00000000-0000-0000-0000-000000000000"

    response = client.patch(f"/api/v1/notifications/{fake_id}/read")

    assert response.status_code == 401


def test_notifications_are_scoped_to_current_user(client: TestClient) -> None:
    token_a = _register_and_login(
        client, username="notif-user-a", email="notif-user-a@example.com"
    )
    token_b = _register_and_login(
        client, username="notif-user-b", email="notif-user-b@example.com"
    )
    user_a_id = _get_user_id(client, token_a)

    # B follows A — A gets a notification, B should get nothing
    client.post(
        f"/api/v1/community/users/{user_a_id}/follow",
        headers=_auth_headers(token_b),
    )

    response_b = client.get(
        "/api/v1/notifications", headers=_auth_headers(token_b)
    )
    assert response_b.json() == []

    response_a = client.get(
        "/api/v1/notifications", headers=_auth_headers(token_a)
    )
    assert len(response_a.json()) == 1


# ── Notification cascade ──────────────────────────────────────────────────────
 
def test_delete_post_clears_related_notification_post_id(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="notif-cascade-author", email="notif-cascade-author@example.com"
    )
    liker_token = _register_and_login(
        client, username="notif-cascade-liker", email="notif-cascade-liker@example.com"
    )
    post = _create_post(client, author_token)
 
    # Like triggers a notification
    client.post(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(liker_token),
    )
 
    # Verify notification exists with post_id set
    notifications_before = client.get(
        "/api/v1/notifications",
        headers=_auth_headers(author_token),
    ).json()
    assert len(notifications_before) == 1
    assert notifications_before[0]["post_id"] == post["id"]
 
    # Delete the post
    client.delete(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(author_token),
    )
 
    # Notification should still exist but post_id should be null
    notifications_after = client.get(
        "/api/v1/notifications",
        headers=_auth_headers(author_token),
    ).json()
    assert len(notifications_after) == 1
    assert notifications_after[0]["post_id"] is None