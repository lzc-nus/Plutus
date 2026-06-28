from __future__ import annotations

from decimal import Decimal

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


def _create_goal(
    client: TestClient,
    token: str,
    *,
    title: str = "Build emergency fund",
    target_amount: str = "60000.00",
    current_amount: str = "42600.00",
    horizon: str = "14 months",
    status: str = "on_track",
    note: str | None = "Reserve covers most essential obligations.",
) -> dict[str, object]:
    response = client.post(
        "/api/v1/strategy/goals",
        headers=_auth_headers(token),
        json={
            "title": title,
            "target_amount": target_amount,
            "current_amount": current_amount,
            "horizon": horizon,
            "status": status,
            "note": note,
        },
    )
    assert response.status_code == 201
    return dict(response.json())


def test_create_and_list_strategy_goal_for_current_user(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="strategy-owner",
        email="strategy-owner@example.com",
    )

    _create_goal(client, token)

    response = client.get(
        "/api/v1/strategy/goals",
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "Build emergency fund"
    assert Decimal(body[0]["target_amount"]) == Decimal("60000.00")
    assert Decimal(body[0]["current_amount"]) == Decimal("42600.00")


def test_strategy_goals_are_scoped_to_current_user(client: TestClient) -> None:
    owner_token = _register_and_login(
        client,
        username="strategy-owner",
        email="strategy-private@example.com",
    )
    viewer_token = _register_and_login(
        client,
        username="strategy-viewer",
        email="strategy-viewer@example.com",
    )

    _create_goal(client, owner_token, title="Private goal")

    response = client.get(
        "/api/v1/strategy/goals",
        headers=_auth_headers(viewer_token),
    )

    assert response.status_code == 200
    assert response.json() == []


def test_update_strategy_goal(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="strategy-owner",
        email="strategy-update@example.com",
    )
    goal = _create_goal(client, token)

    response = client.patch(
        f"/api/v1/strategy/goals/{goal['id']}",
        headers=_auth_headers(token),
        json={
            "current_amount": "45000.00",
            "status": "on_watch",
            "note": "Needs higher monthly surplus.",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert Decimal(body["current_amount"]) == Decimal("45000.00")
    assert body["status"] == "on_watch"
    assert body["note"] == "Needs higher monthly surplus."


def test_delete_strategy_goal(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="strategy-owner",
        email="strategy-delete@example.com",
    )
    goal = _create_goal(client, token)

    response = client.delete(
        f"/api/v1/strategy/goals/{goal['id']}",
        headers=_auth_headers(token),
    )

    assert response.status_code == 204
    list_response = client.get(
        "/api/v1/strategy/goals",
        headers=_auth_headers(token),
    )
    assert list_response.json() == []


def test_strategy_goal_rejects_overfunded_current_amount(client: TestClient) -> None:
    token = _register_and_login(
        client,
        username="strategy-owner",
        email="strategy-invalid@example.com",
    )

    response = client.post(
        "/api/v1/strategy/goals",
        headers=_auth_headers(token),
        json={
            "title": "Impossible goal",
            "target_amount": "100.00",
            "current_amount": "101.00",
            "horizon": "1 month",
            "status": "on_track",
        },
    )

    assert response.status_code == 422


def test_strategy_goals_require_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/strategy/goals")

    assert response.status_code == 401


def test_strategy_memo_content_schema_is_strict_for_openai() -> None:
    from app.features.strategy.schemas import StrategyMemoContent

    schema = StrategyMemoContent.model_json_schema()

    assert schema["additionalProperties"] is False


def test_strategy_memo_uses_goals_in_financial_snapshot(
    client: TestClient,
    monkeypatch,
) -> None:
    from app.features.strategy import service

    token = _register_and_login(
        client,
        username="strategy-owner",
        email="strategy-memo@example.com",
    )
    _create_goal(
        client,
        token,
        title="Buy property in 5 years",
        target_amount="250000.00",
        current_amount="105000.00",
        horizon="5 years",
        status="on_watch",
    )
    monkeypatch.setattr("app.features.ai.service.settings.openai_api_key", "sk-test")
    monkeypatch.setattr("app.features.ai.service.settings.openai_model", "test-strategy-model")

    captured: dict[str, object] = {}

    def fake_request_structured_output(*, config, user_prompt, **_kwargs):
        captured["config"] = config
        captured["user_prompt"] = user_prompt
        return service.StrategyMemoContent(
            answer="Buying the car would slow the property goal unless liquidity improves.",
            key_considerations=["The property goal has a meaningful funding gap."],
            trade_offs=["The car adds optionality cost against the property deposit."],
            next_steps=["Review goal funding order before committing."],
            assumptions=["Only stored Plutus records were analyzed."],
            disclaimer="This is informational and not financial advice.",
        )

    monkeypatch.setattr(service, "request_structured_output", fake_request_structured_output)

    response = client.post(
        "/api/v1/strategy/memo",
        headers=_auth_headers(token),
        json={
            "scenario": "I buy a $120,000 car next year.",
            "time_horizon": "annual",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["model"] == "test-strategy-model"
    assert body["scenario"] == "I buy a $120,000 car next year."
    assert body["time_horizon"] == "annual"
    assert body["answer"].startswith("Buying the car")
    assert "score" not in body
    assert "risk_flags" not in body

    assert "car next year" in str(captured["user_prompt"])

    assert '"goal_count":"1"' not in str(captured["user_prompt"])
    assert '"goal_count":1' in str(captured["user_prompt"])
    assert "Buy property in 5 years" in str(captured["user_prompt"])
    assert '"funded_percent":"42.00"' in str(captured["user_prompt"])
