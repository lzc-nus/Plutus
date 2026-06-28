from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.core.config import settings
from app.features.ai.schemas import AiInsightRequest, AiInsightResponse
from app.features.ai.service import OpenAIConfigurationError


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


def test_ai_insights_require_authentication(client: TestClient) -> None:
    response = client.post(
        "/api/v1/ai/insights",
        json={"time_horizon": "monthly", "focus": "complete"},
    )

    assert response.status_code == 401


def test_ai_insights_return_setup_error_without_openai_key(
    client: TestClient,
    monkeypatch,
) -> None:
    token = _register_and_login(
        client,
        username="ai-owner",
        email="ai-owner@example.com",
    )

    def fake_generate_ai_insight(*_args, **_kwargs):
        raise OpenAIConfigurationError("OPENAI_API_KEY is not configured.")

    monkeypatch.setattr(
        "app.features.ai.router.generate_ai_insight",
        fake_generate_ai_insight,
    )

    response = client.post(
        "/api/v1/ai/insights",
        headers=_auth_headers(token),
        json={"time_horizon": "monthly", "focus": "complete"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "OPENAI_API_KEY is not configured."


def test_ai_insights_return_setup_error_without_openai_model(
    client: TestClient,
    monkeypatch,
) -> None:
    token = _register_and_login(
        client,
        username="ai-owner",
        email="ai-missing-model@example.com",
    )
    monkeypatch.setattr("app.features.ai.service.settings.openai_api_key", "sk-test")
    monkeypatch.setattr("app.features.ai.service.settings.openai_model", None)

    response = client.post(
        "/api/v1/ai/insights",
        headers=_auth_headers(token),
        json={"time_horizon": "monthly", "focus": "complete"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "OPENAI_MODEL is not configured."


def test_ai_insights_return_structured_response(
    client: TestClient,
    monkeypatch,
) -> None:
    token = _register_and_login(
        client,
        username="ai-owner",
        email="ai-success@example.com",
    )
    monkeypatch.setattr(settings, "openai_model", "test-env-model")

    def fake_generate_ai_insight(*_args, payload: AiInsightRequest, **_kwargs):
        assert settings.openai_model is not None
        return AiInsightResponse(
            generated_at="2026-06-27T00:00:00+00:00",
            model=settings.openai_model,
            time_horizon=payload.time_horizon,
            focus=payload.focus,
            score=28,
            label="Stable",
            executive_summary="Cashflow and portfolio risk look manageable.",
            sections=[
                {
                    "title": "Cashflow",
                    "severity": "positive",
                    "summary": "Inflows exceed outflows in the selected range.",
                    "signals": ["Positive net movement"],
                },
                {
                    "title": "Portfolio",
                    "severity": "neutral",
                    "summary": "Allocation review depends on complete holdings.",
                    "signals": ["Asset data present"],
                },
            ],
            action_items=["Review uncategorized transactions."],
            risk_flags=[],
            assumptions=["Only records stored in Plutus were analyzed."],
            disclaimer="This is informational and not financial advice.",
        )

    monkeypatch.setattr(
        "app.features.ai.router.generate_ai_insight",
        fake_generate_ai_insight,
    )

    response = client.post(
        "/api/v1/ai/insights",
        headers=_auth_headers(token),
        json={
            "time_horizon": "monthly",
            "focus": "cashflow",
            "question": "Where is cash leaking?",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["model"] == settings.openai_model
    assert body["time_horizon"] == "monthly"
    assert body["focus"] == "cashflow"
    assert body["score"] == 28
    assert body["sections"][0]["title"] == "Cashflow"


def test_generate_ai_insight_uses_configured_openai_runtime_settings(monkeypatch) -> None:
    from app.features.ai import service

    monkeypatch.setattr(service.settings, "openai_api_key", "sk-test")
    monkeypatch.setattr(service.settings, "openai_model", "gpt-5.4-mini")
    monkeypatch.setattr(service.settings, "openai_reasoning_effort", "low")
    monkeypatch.setattr(service.settings, "openai_max_output_tokens", 1200)
    monkeypatch.setattr(service.settings, "openai_request_timeout_seconds", 30.0)
    monkeypatch.setattr(service.settings, "openai_store_responses", False)
    monkeypatch.setattr(
        service,
        "build_financial_snapshot",
        lambda *_args, **_kwargs: {"summary": {"net_worth": "100.00"}},
    )

    captured = {}

    def fake_request_structured_insight(*, openai_config, snapshot, payload):
        captured["openai_config"] = openai_config
        captured["snapshot"] = snapshot
        captured["payload"] = payload
        return service.AiInsightContent(
            score=20,
            label="Stable",
            executive_summary="A compact generated report.",
            sections=[
                {
                    "title": "Cashflow",
                    "severity": "neutral",
                    "summary": "Records are limited but stable.",
                    "signals": ["Snapshot available"],
                },
                {
                    "title": "Risk",
                    "severity": "watch",
                    "summary": "Review data completeness before decisions.",
                    "signals": ["Limited context"],
                },
            ],
            action_items=["Review imported records."],
            risk_flags=[],
            assumptions=["Only stored records were analyzed."],
            disclaimer="This is informational and not financial advice.",
        )

    monkeypatch.setattr(
        service,
        "_request_structured_insight",
        fake_request_structured_insight,
    )

    payload = AiInsightRequest(time_horizon="monthly", focus="complete")
    response = service.generate_ai_insight(
        object(),
        user_id=uuid.uuid4(),
        payload=payload,
    )

    openai_config = captured["openai_config"]
    assert openai_config.model == "gpt-5.4-mini"
    assert openai_config.reasoning_effort == "low"
    assert openai_config.max_output_tokens == 1200
    assert openai_config.request_timeout_seconds == 30.0
    assert openai_config.store_responses is False
    assert captured["snapshot"] == {"summary": {"net_worth": "100.00"}}
    assert captured["payload"] == payload
    assert response.model == "gpt-5.4-mini"
