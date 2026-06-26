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


def _create_post(
    client: TestClient,
    token: str,
    *,
    content: str = "Markets are looking volatile this quarter.",
) -> dict[str, object]:
    response = client.post(
        "/api/v1/community/posts",
        headers=_auth_headers(token),
        json={"content_blocks": [{"type": "text", "value": content}]},
    )
    assert response.status_code == 201
    return dict(response.json())


def _create_comment(
    client: TestClient,
    token: str,
    *,
    post_id: str,
    content: str = "Agreed, rebalancing now.",
) -> dict[str, object]:
    response = client.post(
        f"/api/v1/community/posts/{post_id}/comments",
        headers=_auth_headers(token),
        json={"content_blocks": [{"type": "text", "value": content}]},
    )
    assert response.status_code == 201
    return dict(response.json())


# ── Posts ─────────────────────────────────────────────────────────────────────

def test_create_and_get_post(client: TestClient) -> None:
    token = _register_and_login(
        client, username="post-author", email="post-author@example.com"
    )

    post = _create_post(client, token)

    response = client.get(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == post["id"]
    assert body["content_blocks"][0]["value"] == "Markets are looking volatile this quarter."
    assert body["like_count"] == 0
    assert body["comment_count"] == 0


def test_guest_can_get_post_without_user_state(client: TestClient) -> None:
    token = _register_and_login(
        client, username="public-post-author", email="public-post-author@example.com"
    )
    post = _create_post(client, token, content="Public research note.")

    response = client.get(f"/api/v1/community/posts/{post['id']}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == post["id"]
    assert body["content_blocks"][0]["value"] == "Public research note."
    assert body["is_liked_by_me"] is False
    assert body["is_saved_by_me"] is False


def test_post_requires_at_least_one_content_block(client: TestClient) -> None:
    token = _register_and_login(
        client, username="post-author", email="post-author@example.com"
    )

    response = client.post(
        "/api/v1/community/posts",
        headers=_auth_headers(token),
        json={"content_blocks": []},
    )

    assert response.status_code == 422


def test_post_rejects_invalid_block_type(client: TestClient) -> None:
    token = _register_and_login(
        client, username="post-author", email="post-author@example.com"
    )

    response = client.post(
        "/api/v1/community/posts",
        headers=_auth_headers(token),
        json={"content_blocks": [{"type": "unknown_type", "value": "hello"}]},
    )

    assert response.status_code == 422


def test_post_rejects_non_http_url_block(client: TestClient) -> None:
    token = _register_and_login(
        client, username="post-author", email="post-author@example.com"
    )

    response = client.post(
        "/api/v1/community/posts",
        headers=_auth_headers(token),
        json={"content_blocks": [{"type": "link", "url": "javascript:alert(1)"}]},
    )

    assert response.status_code == 422


def test_update_post(client: TestClient) -> None:
    token = _register_and_login(
        client, username="post-author", email="post-author@example.com"
    )
    post = _create_post(client, token)

    response = client.patch(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(token),
        json={"content_blocks": [{"type": "text", "value": "Edited: rotating into bonds."}]},
    )

    assert response.status_code == 200
    assert response.json()["content_blocks"][0]["value"] == "Edited: rotating into bonds."


def test_update_post_by_non_author_returns_404(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="post-author", email="post-author@example.com"
    )
    other_token = _register_and_login(
        client, username="post-intruder", email="post-intruder@example.com"
    )
    post = _create_post(client, author_token)

    response = client.patch(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(other_token),
        json={"content_blocks": [{"type": "text", "value": "Hijacked."}]},
    )

    assert response.status_code == 404


def test_delete_post(client: TestClient) -> None:
    token = _register_and_login(
        client, username="post-author", email="post-author@example.com"
    )
    post = _create_post(client, token)

    delete_response = client.delete(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(token),
    )
    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(token),
    )
    assert get_response.status_code == 404


def test_delete_post_with_related_activity(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="post-author", email="post-author@example.com"
    )
    actor_token = _register_and_login(
        client, username="post-actor", email="post-actor@example.com"
    )
    post = _create_post(client, author_token)
    comment = _create_comment(client, actor_token, post_id=str(post["id"]))

    activity_responses = [
        client.post(
            f"/api/v1/community/posts/{post['id']}/like",
            headers=_auth_headers(actor_token),
        ),
        client.post(
            f"/api/v1/community/posts/{post['id']}/save",
            headers=_auth_headers(actor_token),
        ),
        client.post(
            f"/api/v1/community/posts/{post['id']}/share",
            headers=_auth_headers(actor_token),
        ),
        client.post(
            f"/api/v1/community/posts/{post['id']}/repost",
            headers=_auth_headers(actor_token),
            json={"content_blocks": []},
        ),
        client.post(
            f"/api/v1/community/posts/{post['id']}/comments/{comment['id']}/like",
            headers=_auth_headers(author_token),
        ),
        client.post(
            f"/api/v1/community/posts/{post['id']}/comments/{comment['id']}/share",
            headers=_auth_headers(author_token),
        ),
    ]
    assert [response.status_code for response in activity_responses] == [201] * 6

    delete_response = client.delete(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(author_token),
    )

    assert delete_response.status_code == 204
    assert client.get(f"/api/v1/community/posts/{post['id']}").status_code == 404


def test_delete_post_by_non_author_returns_404(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="post-author", email="post-author@example.com"
    )
    other_token = _register_and_login(
        client, username="post-intruder", email="post-intruder@example.com"
    )
    post = _create_post(client, author_token)

    response = client.delete(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(other_token),
    )

    assert response.status_code == 404


def test_post_requires_authentication(client: TestClient) -> None:
    response = client.post(
        "/api/v1/community/posts",
        json={"content_blocks": [{"type": "text", "value": "No auth."}]},
    )

    assert response.status_code == 401


# ── Feed ──────────────────────────────────────────────────────────────────────

def test_global_feed_returns_all_posts(client: TestClient) -> None:
    token_a = _register_and_login(
        client, username="feed-user-a", email="feed-user-a@example.com"
    )
    token_b = _register_and_login(
        client, username="feed-user-b", email="feed-user-b@example.com"
    )
    _create_post(client, token_a, content="Post from A.")
    _create_post(client, token_b, content="Post from B.")

    response = client.get(
        "/api/v1/community/feed/global",
        headers=_auth_headers(token_a),
    )

    assert response.status_code == 200
    contents = [b["content_blocks"][0]["value"] for b in response.json()]
    assert "Post from A." in contents
    assert "Post from B." in contents


def test_guest_can_read_global_feed(client: TestClient) -> None:
    token = _register_and_login(
        client, username="guest-feed-author", email="guest-feed-author@example.com"
    )
    post = _create_post(client, token, content="Visible to guests.")

    response = client.get("/api/v1/community/feed/global")

    assert response.status_code == 200
    visible_post = next(p for p in response.json() if p["id"] == post["id"])
    assert visible_post["content_blocks"][0]["value"] == "Visible to guests."
    assert visible_post["is_liked_by_me"] is False
    assert visible_post["is_saved_by_me"] is False


def test_following_feed_only_returns_followed_users_posts(client: TestClient) -> None:
    follower_token = _register_and_login(
        client, username="feed-follower", email="feed-follower@example.com"
    )
    followed_token = _register_and_login(
        client, username="feed-followed", email="feed-followed@example.com"
    )
    stranger_token = _register_and_login(
        client, username="feed-stranger", email="feed-stranger@example.com"
    )

    # Get followed user's ID
    followed_me = client.get(
        "/api/v1/users/me", headers=_auth_headers(followed_token)
    )
    followed_id = followed_me.json()["id"]

    # Follow
    client.post(
        f"/api/v1/community/users/{followed_id}/follow",
        headers=_auth_headers(follower_token),
    )

    _create_post(client, followed_token, content="Post from followed user.")
    _create_post(client, stranger_token, content="Post from stranger.")

    response = client.get(
        "/api/v1/community/feed",
        headers=_auth_headers(follower_token),
    )

    assert response.status_code == 200
    contents = [b["content_blocks"][0]["value"] for b in response.json()]
    assert "Post from followed user." in contents
    assert "Post from stranger." not in contents


def test_following_feed_falls_back_to_global_when_following_nobody(client: TestClient) -> None:
    token_a = _register_and_login(
        client, username="feed-lonely", email="feed-lonely@example.com"
    )
    token_b = _register_and_login(
        client, username="feed-poster", email="feed-poster@example.com"
    )
    _create_post(client, token_b, content="Visible to lonely user.")

    response = client.get(
        "/api/v1/community/feed",
        headers=_auth_headers(token_a),
    )

    assert response.status_code == 200
    contents = [b["content_blocks"][0]["value"] for b in response.json()]
    assert "Visible to lonely user." in contents


# ── Comments ──────────────────────────────────────────────────────────────────

def test_create_and_list_comments(client: TestClient) -> None:
    token = _register_and_login(
        client, username="commenter", email="commenter@example.com"
    )
    post = _create_post(client, token)
    _create_comment(client, token, post_id=post["id"])

    response = client.get(
        f"/api/v1/community/posts/{post['id']}/comments",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["content_blocks"][0]["value"] == "Agreed, rebalancing now."


def test_guest_can_list_comments(client: TestClient) -> None:
    token = _register_and_login(
        client, username="public-commenter", email="public-commenter@example.com"
    )
    post = _create_post(client, token)
    _create_comment(client, token, post_id=post["id"], content="Public comment.")

    response = client.get(f"/api/v1/community/posts/{post['id']}/comments")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["content_blocks"][0]["value"] == "Public comment."


def test_comment_increments_post_comment_count(client: TestClient) -> None:
    token = _register_and_login(
        client, username="commenter", email="commenter@example.com"
    )
    post = _create_post(client, token)
    _create_comment(client, token, post_id=post["id"])

    response = client.get(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(token),
    )

    assert response.json()["comment_count"] == 1


def test_delete_comment_decrements_post_comment_count(client: TestClient) -> None:
    token = _register_and_login(
        client, username="commenter", email="commenter@example.com"
    )
    post = _create_post(client, token)
    comment = _create_comment(client, token, post_id=post["id"])

    client.delete(
        f"/api/v1/community/posts/{post['id']}/comments/{comment['id']}",
        headers=_auth_headers(token),
    )

    response = client.get(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(token),
    )
    assert response.json()["comment_count"] == 0


def test_delete_comment_with_related_activity(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="comment-author", email="comment-author@example.com"
    )
    actor_token = _register_and_login(
        client, username="comment-actor", email="comment-actor@example.com"
    )
    post = _create_post(client, author_token)
    comment = _create_comment(client, author_token, post_id=post["id"])

    like_response = client.post(
        f"/api/v1/community/posts/{post['id']}/comments/{comment['id']}/like",
        headers=_auth_headers(actor_token),
    )
    share_response = client.post(
        f"/api/v1/community/posts/{post['id']}/comments/{comment['id']}/share",
        headers=_auth_headers(actor_token),
    )
    assert like_response.status_code == 201
    assert share_response.status_code == 201

    delete_response = client.delete(
        f"/api/v1/community/posts/{post['id']}/comments/{comment['id']}",
        headers=_auth_headers(author_token),
    )

    assert delete_response.status_code == 204
    comments_response = client.get(f"/api/v1/community/posts/{post['id']}/comments")
    assert comments_response.json() == []


def test_update_comment_by_non_author_returns_404(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="comment-author", email="comment-author@example.com"
    )
    other_token = _register_and_login(
        client, username="comment-intruder", email="comment-intruder@example.com"
    )
    post = _create_post(client, author_token)
    comment = _create_comment(client, author_token, post_id=post["id"])

    response = client.patch(
        f"/api/v1/community/posts/{post['id']}/comments/{comment['id']}",
        headers=_auth_headers(other_token),
        json={"content_blocks": [{"type": "text", "value": "Hijacked comment."}]},
    )

    assert response.status_code == 404


def test_update_comment_through_wrong_post_returns_404(client: TestClient) -> None:
    token = _register_and_login(
        client, username="comment-author", email="comment-author@example.com"
    )
    post = _create_post(client, token, content="Original post.")
    other_post = _create_post(client, token, content="Different post.")
    comment = _create_comment(client, token, post_id=post["id"])

    response = client.patch(
        f"/api/v1/community/posts/{other_post['id']}/comments/{comment['id']}",
        headers=_auth_headers(token),
        json={"content_blocks": [{"type": "text", "value": "Wrong parent."}]},
    )

    assert response.status_code == 404


def test_delete_comment_through_wrong_post_returns_404(client: TestClient) -> None:
    token = _register_and_login(
        client, username="comment-author", email="comment-author@example.com"
    )
    post = _create_post(client, token, content="Original post.")
    other_post = _create_post(client, token, content="Different post.")
    comment = _create_comment(client, token, post_id=post["id"])

    response = client.delete(
        f"/api/v1/community/posts/{other_post['id']}/comments/{comment['id']}",
        headers=_auth_headers(token),
    )

    assert response.status_code == 404

    comments_response = client.get(
        f"/api/v1/community/posts/{post['id']}/comments",
        headers=_auth_headers(token),
    )
    assert len(comments_response.json()) == 1


def test_comment_on_nonexistent_post_returns_404(client: TestClient) -> None:
    token = _register_and_login(
        client, username="commenter", email="commenter@example.com"
    )
    fake_id = "00000000-0000-0000-0000-000000000000"

    response = client.post(
        f"/api/v1/community/posts/{fake_id}/comments",
        headers=_auth_headers(token),
        json={"content_blocks": [{"type": "text", "value": "Ghost comment."}]},
    )

    assert response.status_code == 404


# ── Likes ─────────────────────────────────────────────────────────────────────

def test_like_post_increments_like_count(client: TestClient) -> None:
    token = _register_and_login(
        client, username="liker", email="liker@example.com"
    )
    post = _create_post(client, token)

    response = client.post(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(token),
    )

    assert response.status_code == 201
    assert response.json()["like_count"] == 1


def test_unlike_post_decrements_like_count(client: TestClient) -> None:
    token = _register_and_login(
        client, username="liker", email="liker@example.com"
    )
    post = _create_post(client, token)
    client.post(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(token),
    )

    client.delete(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(token),
    )

    response = client.get(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(token),
    )
    assert response.json()["like_count"] == 0


def test_duplicate_like_returns_409(client: TestClient) -> None:
    token = _register_and_login(
        client, username="liker", email="liker@example.com"
    )
    post = _create_post(client, token)
    client.post(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(token),
    )

    response = client.post(
        f"/api/v1/community/posts/{post['id']}/like",
        headers=_auth_headers(token),
    )

    assert response.status_code == 409


def test_feed_marks_post_liked_and_saved_by_current_user(client: TestClient) -> None:
    token = _register_and_login(
        client, username="state-user", email="state-user@example.com"
    )
    other_token = _register_and_login(
        client, username="state-other", email="state-other@example.com"
    )
    post = _create_post(client, token)

    client.post(f"/api/v1/community/posts/{post['id']}/like", headers=_auth_headers(token))
    client.post(f"/api/v1/community/posts/{post['id']}/save", headers=_auth_headers(token))

    owner_feed = client.get("/api/v1/community/feed/global", headers=_auth_headers(token))
    owner_post = next(p for p in owner_feed.json() if p["id"] == post["id"])
    assert owner_post["is_liked_by_me"] is True
    assert owner_post["is_saved_by_me"] is True

    other_feed = client.get("/api/v1/community/feed/global", headers=_auth_headers(other_token))
    other_post = next(p for p in other_feed.json() if p["id"] == post["id"])
    assert other_post["is_liked_by_me"] is False
    assert other_post["is_saved_by_me"] is False


def test_user_posts_returns_only_that_users_posts_for_guests(client: TestClient) -> None:
    target_token = _register_and_login(
        client, username="target-poster", email="target-poster@example.com"
    )
    other_token = _register_and_login(
        client, username="other-poster", email="other-poster@example.com"
    )
    target_id = client.get(
        "/api/v1/users/me", headers=_auth_headers(target_token)
    ).json()["id"]
    target_post = _create_post(client, target_token, content="Target post.")
    _create_post(client, other_token, content="Other post.")

    response = client.get(f"/api/v1/community/users/{target_id}/posts")

    assert response.status_code == 200
    body = response.json()
    assert any(p["id"] == target_post["id"] for p in body)
    assert all(p["author_id"] == target_id for p in body)
    assert all(p["is_liked_by_me"] is False for p in body)
    assert all(p["is_saved_by_me"] is False for p in body)


def test_like_comment_increments_like_count(client: TestClient) -> None:
    token = _register_and_login(
        client, username="liker", email="liker@example.com"
    )
    post = _create_post(client, token)
    comment = _create_comment(client, token, post_id=post["id"])

    response = client.post(
        f"/api/v1/community/posts/{post['id']}/comments/{comment['id']}/like",
        headers=_auth_headers(token),
    )

    assert response.status_code == 201
    assert response.json()["like_count"] == 1


def test_follow_nonexistent_user_returns_404(client: TestClient) -> None:
    token = _register_and_login(
        client, username="follower", email="follower@example.com"
    )
    fake_id = "00000000-0000-0000-0000-000000000000"

    response = client.post(
        f"/api/v1/community/users/{fake_id}/follow",
        headers=_auth_headers(token),
    )

    assert response.status_code == 404


# ── Saves ─────────────────────────────────────────────────────────────────────

def test_save_post_increments_save_count(client: TestClient) -> None:
    token = _register_and_login(
        client, username="saver", email="saver@example.com"
    )
    post = _create_post(client, token)

    response = client.post(
        f"/api/v1/community/posts/{post['id']}/save",
        headers=_auth_headers(token),
    )

    assert response.status_code == 201
    assert response.json()["save_count"] == 1


def test_saved_posts_list_returns_saved_posts(client: TestClient) -> None:
    token = _register_and_login(
        client, username="saver", email="saver@example.com"
    )
    post = _create_post(client, token)
    client.post(
        f"/api/v1/community/posts/{post['id']}/save",
        headers=_auth_headers(token),
    )

    response = client.get(
        "/api/v1/community/posts/saved",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    ids = [p["id"] for p in response.json()]
    assert post["id"] in ids


def test_unsave_post_removes_from_saved_list(client: TestClient) -> None:
    token = _register_and_login(
        client, username="saver", email="saver@example.com"
    )
    post = _create_post(client, token)
    client.post(
        f"/api/v1/community/posts/{post['id']}/save",
        headers=_auth_headers(token),
    )
    client.delete(
        f"/api/v1/community/posts/{post['id']}/save",
        headers=_auth_headers(token),
    )

    response = client.get(
        "/api/v1/community/posts/saved",
        headers=_auth_headers(token),
    )

    ids = [p["id"] for p in response.json()]
    assert post["id"] not in ids


def test_duplicate_save_returns_409(client: TestClient) -> None:
    token = _register_and_login(
        client, username="saver", email="saver@example.com"
    )
    post = _create_post(client, token)
    client.post(
        f"/api/v1/community/posts/{post['id']}/save",
        headers=_auth_headers(token),
    )

    response = client.post(
        f"/api/v1/community/posts/{post['id']}/save",
        headers=_auth_headers(token),
    )

    assert response.status_code == 409


# ── Shares ────────────────────────────────────────────────────────────────────

def test_share_post_increments_share_count_and_returns_url(client: TestClient) -> None:
    token = _register_and_login(
        client, username="sharer", email="sharer@example.com"
    )
    post = _create_post(client, token)

    response = client.post(
        f"/api/v1/community/posts/{post['id']}/share",
        headers=_auth_headers(token),
    )

    assert response.status_code == 201
    body = response.json()
    assert "share_url" in body
    assert body["share_url"].endswith(f"/community/posts/{post['id']}")

    post_response = client.get(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(token),
    )
    assert post_response.json()["share_count"] == 1


def test_share_post_multiple_times_accumulates_count(client: TestClient) -> None:
    token = _register_and_login(
        client, username="sharer", email="sharer@example.com"
    )
    post = _create_post(client, token)

    client.post(
        f"/api/v1/community/posts/{post['id']}/share",
        headers=_auth_headers(token),
    )
    client.post(
        f"/api/v1/community/posts/{post['id']}/share",
        headers=_auth_headers(token),
    )

    response = client.get(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(token),
    )
    assert response.json()["share_count"] == 2


# ── Reposts ───────────────────────────────────────────────────────────────────

def test_simple_repost_increments_repost_count(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="repost-author", email="repost-author@example.com"
    )
    reposter_token = _register_and_login(
        client, username="reposter", email="reposter@example.com"
    )
    post = _create_post(client, author_token)

    response = client.post(
        f"/api/v1/community/posts/{post['id']}/repost",
        headers=_auth_headers(reposter_token),
        json={"content_blocks": []},
    )

    assert response.status_code == 201
    assert response.json()["content_blocks"] == []

    post_response = client.get(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(author_token),
    )
    assert post_response.json()["repost_count"] == 1


def test_quote_repost_stores_content_blocks(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="repost-author", email="repost-author@example.com"
    )
    reposter_token = _register_and_login(
        client, username="reposter", email="reposter@example.com"
    )
    post = _create_post(client, author_token)

    response = client.post(
        f"/api/v1/community/posts/{post['id']}/repost",
        headers=_auth_headers(reposter_token),
        json={"content_blocks": [{"type": "text", "value": "Interesting take on volatility."}]},
    )

    assert response.status_code == 201
    assert response.json()["content_blocks"][0]["value"] == "Interesting take on volatility."


def test_delete_repost_decrements_repost_count(client: TestClient) -> None:
    author_token = _register_and_login(
        client, username="repost-author", email="repost-author@example.com"
    )
    reposter_token = _register_and_login(
        client, username="reposter", email="reposter@example.com"
    )
    post = _create_post(client, author_token)
    repost = client.post(
        f"/api/v1/community/posts/{post['id']}/repost",
        headers=_auth_headers(reposter_token),
        json={"content_blocks": []},
    ).json()

    client.delete(
        f"/api/v1/community/reposts/{repost['id']}",
        headers=_auth_headers(reposter_token),
    )

    post_response = client.get(
        f"/api/v1/community/posts/{post['id']}",
        headers=_auth_headers(author_token),
    )
    assert post_response.json()["repost_count"] == 0


# ── Follows ───────────────────────────────────────────────────────────────────

def test_follow_and_unfollow_user(client: TestClient) -> None:
    follower_token = _register_and_login(
        client, username="follower", email="follower@example.com"
    )
    followee_token = _register_and_login(
        client, username="followee", email="followee@example.com"
    )
    followee_id = client.get(
        "/api/v1/users/me", headers=_auth_headers(followee_token)
    ).json()["id"]

    follow_response = client.post(
        f"/api/v1/community/users/{followee_id}/follow",
        headers=_auth_headers(follower_token),
    )
    assert follow_response.status_code == 201

    unfollow_response = client.delete(
        f"/api/v1/community/users/{followee_id}/follow",
        headers=_auth_headers(follower_token),
    )
    assert unfollow_response.status_code == 204


def test_duplicate_follow_returns_409(client: TestClient) -> None:
    follower_token = _register_and_login(
        client, username="follower", email="follower@example.com"
    )
    followee_token = _register_and_login(
        client, username="followee", email="followee@example.com"
    )
    followee_id = client.get(
        "/api/v1/users/me", headers=_auth_headers(followee_token)
    ).json()["id"]

    client.post(
        f"/api/v1/community/users/{followee_id}/follow",
        headers=_auth_headers(follower_token),
    )
    response = client.post(
        f"/api/v1/community/users/{followee_id}/follow",
        headers=_auth_headers(follower_token),
    )

    assert response.status_code == 409


def test_self_follow_returns_409(client: TestClient) -> None:
    token = _register_and_login(
        client, username="narcissist", email="narcissist@example.com"
    )
    user_id = client.get(
        "/api/v1/users/me", headers=_auth_headers(token)
    ).json()["id"]

    response = client.post(
        f"/api/v1/community/users/{user_id}/follow",
        headers=_auth_headers(token),
    )

    assert response.status_code == 409


def test_following_and_followers_lists(client: TestClient) -> None:
    follower_token = _register_and_login(
        client, username="follower", email="follower@example.com"
    )
    followee_token = _register_and_login(
        client, username="followee", email="followee@example.com"
    )
    follower_id = client.get(
        "/api/v1/users/me", headers=_auth_headers(follower_token)
    ).json()["id"]
    followee_id = client.get(
        "/api/v1/users/me", headers=_auth_headers(followee_token)
    ).json()["id"]

    client.post(
        f"/api/v1/community/users/{followee_id}/follow",
        headers=_auth_headers(follower_token),
    )

    following_response = client.get(f"/api/v1/community/users/{follower_id}/following")
    followers_response = client.get(f"/api/v1/community/users/{followee_id}/followers")

    assert following_response.status_code == 200
    assert any(f["followee_id"] == followee_id for f in following_response.json())

    assert followers_response.status_code == 200
    assert any(f["follower_id"] == follower_id for f in followers_response.json())
