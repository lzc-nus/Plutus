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


def _create_event(
    client: TestClient,
    token: str,
    *,
    title: str = "Quarterly tax review",
    start_at: str = "2026-01-15T09:00:00+00:00",
    end_at: str = "2026-01-15T10:00:00+00:00",
    recurrence_option: str = "NONE",
    color: str = "GOLD",
) -> dict[str, object]:
    response = client.post(
        "/api/v1/calendar/events",
        headers=_auth_headers(token),
        json={
            "title": title,
            "description": "Review expected cash requirement.",
            "start_at": start_at,
            "end_at": end_at,
            "is_all_day": False,
            "recurrence_option": recurrence_option,
            "color": color,
        },
    )
    assert response.status_code == 201
    return dict(response.json())


def test_create_and_list_calendar_event_for_current_user(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="calendar-owner",
        email="calendar-owner@example.com",
    )

    _create_event(client, token)

    response = client.get(
        "/api/v1/calendar/events",
        headers=_auth_headers(token),
        params={
            "start_window": "2026-01-01T00:00:00+00:00",
            "end_window": "2026-02-01T00:00:00+00:00",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "Quarterly tax review"
    assert body[0]["color"] == "GOLD"


def test_calendar_events_are_scoped_to_current_user(client: TestClient) -> None:
    first_token = _register_and_login(
        client,
        username="calendar-owner",
        email="calendar-owner@example.com",
    )
    second_token = _register_and_login(
        client,
        username="calendar-viewer",
        email="calendar-viewer@example.com",
    )
    _create_event(client, first_token, title="Private liquidity call")

    response = client.get(
        "/api/v1/calendar/events",
        headers=_auth_headers(second_token),
        params={
            "start_window": "2026-01-01T00:00:00+00:00",
            "end_window": "2026-02-01T00:00:00+00:00",
        },
    )

    assert response.status_code == 200
    assert response.json() == []


def test_weekly_recurring_event_expands_inside_later_window(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="calendar-owner",
        email="calendar-owner@example.com",
    )
    _create_event(
        client,
        token,
        title="Weekly allocation review",
        start_at="2026-01-01T09:00:00+00:00",
        end_at="2026-01-01T10:00:00+00:00",
        recurrence_option="WEEKLY_SAME_DAY",
    )

    response = client.get(
        "/api/v1/calendar/events",
        headers=_auth_headers(token),
        params={
            "start_window": "2026-01-14T00:00:00+00:00",
            "end_window": "2026-01-16T00:00:00+00:00",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "Weekly allocation review"
    assert body[0]["start_at"].startswith("2026-01-15T09:00:00")
    assert body[0]["is_recurring_instance"] is True


def test_delete_single_recurring_instance_keeps_series(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="calendar-owner",
        email="calendar-owner@example.com",
    )
    event = _create_event(
        client,
        token,
        title="Weekly allocation review",
        color="OLIVE",
        start_at="2026-01-01T09:00:00+00:00",
        end_at="2026-01-01T10:00:00+00:00",
        recurrence_option="WEEKLY_SAME_DAY",
    )

    delete_response = client.delete(
        f"/api/v1/calendar/events/{event['id']}",
        headers=_auth_headers(token),
        params={"scope": "THIS_INSTANCE", "instance_date": "2026-01-15"},
    )
    assert delete_response.status_code == 204

    response = client.get(
        "/api/v1/calendar/events",
        headers=_auth_headers(token),
        params={
            "start_window": "2026-01-01T00:00:00+00:00",
            "end_window": "2026-01-23T00:00:00+00:00",
        },
    )

    assert response.status_code == 200
    starts = [item["start_at"][:10] for item in response.json()]
    assert "2026-01-15" not in starts
    assert {"2026-01-01", "2026-01-08", "2026-01-22"}.issubset(starts)


def test_delete_entire_recurring_series_after_instance_exception(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="calendar-owner",
        email="calendar-owner@example.com",
    )
    event = _create_event(
        client,
        token,
        title="Weekly allocation review",
        start_at="2026-01-01T09:00:00+00:00",
        end_at="2026-01-01T10:00:00+00:00",
        recurrence_option="WEEKLY_SAME_DAY",
    )

    instance_delete_response = client.delete(
        f"/api/v1/calendar/events/{event['id']}",
        headers=_auth_headers(token),
        params={"scope": "THIS_INSTANCE", "instance_date": "2026-01-15"},
    )
    assert instance_delete_response.status_code == 204

    series_delete_response = client.delete(
        f"/api/v1/calendar/events/{event['id']}",
        headers=_auth_headers(token),
        params={"scope": "ALL_SESSIONS"},
    )
    assert series_delete_response.status_code == 204

    response = client.get(
        "/api/v1/calendar/events",
        headers=_auth_headers(token),
        params={
            "start_window": "2026-01-01T00:00:00+00:00",
            "end_window": "2026-01-31T00:00:00+00:00",
        },
    )

    assert response.status_code == 200
    assert response.json() == []


def test_update_single_recurring_instance_detaches_event(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="calendar-owner",
        email="calendar-owner@example.com",
    )
    event = _create_event(
        client,
        token,
        title="Weekly allocation review",
        start_at="2026-01-01T09:00:00+00:00",
        end_at="2026-01-01T10:00:00+00:00",
        recurrence_option="WEEKLY_SAME_DAY",
    )

    patch_response = client.patch(
        f"/api/v1/calendar/events/{event['id']}",
        headers=_auth_headers(token),
        json={
            "title": "Moved allocation review",
            "start_at": "2026-01-15T14:00:00+00:00",
            "end_at": "2026-01-15T15:00:00+00:00",
            "color": "WINE",
            "update_scope": "THIS_INSTANCE",
            "instance_original_date": "2026-01-15",
        },
    )
    assert patch_response.status_code == 200

    response = client.get(
        "/api/v1/calendar/events",
        headers=_auth_headers(token),
        params={
            "start_window": "2026-01-14T00:00:00+00:00",
            "end_window": "2026-01-16T00:00:00+00:00",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "Moved allocation review"
    assert body[0]["color"] == "WINE"
    assert body[0]["start_at"].startswith("2026-01-15T14:00:00")


def test_update_entire_series_allows_same_local_date_with_timezone_offset(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="calendar-owner",
        email="calendar-owner@example.com",
    )
    event = _create_event(
        client,
        token,
        title="Late local review",
        start_at="2026-06-15T01:00:00+08:00",
        end_at="2026-06-15T10:00:00+08:00",
        recurrence_option="WEEKLY_SAME_DAY",
    )

    response = client.patch(
        f"/api/v1/calendar/events/{event['id']}",
        headers=_auth_headers(token),
        json={
            "title": "Late local review updated",
            "start_at": "2026-06-15T01:00:00+08:00",
            "end_at": "2026-06-15T22:00:00+08:00",
            "update_scope": "ALL_SESSIONS",
        },
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Late local review updated"


def test_calendar_event_rejects_unknown_color(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="calendar-owner",
        email="calendar-owner@example.com",
    )

    response = client.post(
        "/api/v1/calendar/events",
        headers=_auth_headers(token),
        json={
            "title": "Unsupported color review",
            "description": "Should be rejected.",
            "start_at": "2026-01-15T09:00:00+00:00",
            "end_at": "2026-01-15T10:00:00+00:00",
            "is_all_day": False,
            "recurrence_option": "NONE",
            "color": "NEON_PURPLE",
        },
    )

    assert response.status_code == 422


def test_recurring_calendar_event_cannot_span_multiple_days(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="calendar-owner",
        email="calendar-owner@example.com",
    )

    response = client.post(
        "/api/v1/calendar/events",
        headers=_auth_headers(token),
        json={
            "title": "Week-long weekly review",
            "description": "Should not fill every day in between.",
            "start_at": "2026-01-05T09:00:00+00:00",
            "end_at": "2026-01-12T10:00:00+00:00",
            "is_all_day": False,
            "recurrence_option": "WEEKLY_SAME_DAY",
            "color": "OLIVE",
        },
    )

    assert response.status_code == 422


def test_calendar_events_require_authentication(client: TestClient) -> None:
    response = client.get(
        "/api/v1/calendar/events",
        params={
            "start_window": "2026-01-01T00:00:00+00:00",
            "end_window": "2026-02-01T00:00:00+00:00",
        },
    )

    assert response.status_code == 401
