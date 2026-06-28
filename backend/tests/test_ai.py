from __future__ import annotations

import json
import sys
import uuid
from types import SimpleNamespace

from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.core.config import settings
from app.features.ai.service import OpenAIConfigurationError
from app.features.insights.schemas import InsightRequest, InsightResponse


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


def test_insights_require_authentication(client: TestClient) -> None:
    response = client.post(
        "/api/v1/insights",
        json={"time_horizon": "monthly", "focus": "complete"},
    )

    assert response.status_code == 401


def test_insights_return_setup_error_without_openai_key(
    client: TestClient,
    monkeypatch,
) -> None:
    token = _register_and_login(
        client,
        username="insight-owner",
        email="insight-owner@example.com",
    )

    def fake_generate_insight(*_args, **_kwargs):
        raise OpenAIConfigurationError("OPENAI_API_KEY is not configured.")

    monkeypatch.setattr(
        "app.features.insights.router.generate_insight",
        fake_generate_insight,
    )

    response = client.post(
        "/api/v1/insights",
        headers=_auth_headers(token),
        json={"time_horizon": "monthly", "focus": "complete"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "OPENAI_API_KEY is not configured."


def test_insights_return_setup_error_without_openai_model(
    client: TestClient,
    monkeypatch,
) -> None:
    token = _register_and_login(
        client,
        username="insight-owner",
        email="insight-missing-model@example.com",
    )
    monkeypatch.setattr("app.features.ai.service.settings.openai_api_key", "sk-test")
    monkeypatch.setattr("app.features.ai.service.settings.openai_model", None)

    response = client.post(
        "/api/v1/insights",
        headers=_auth_headers(token),
        json={"time_horizon": "monthly", "focus": "complete"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "OPENAI_MODEL is not configured."


def test_insights_return_structured_response(
    client: TestClient,
    monkeypatch,
) -> None:
    token = _register_and_login(
        client,
        username="insight-owner",
        email="insight-success@example.com",
    )
    monkeypatch.setattr(settings, "openai_model", "test-env-model")

    def fake_generate_insight(*_args, payload: InsightRequest, **_kwargs):
        assert settings.openai_model is not None
        return InsightResponse(
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
        "app.features.insights.router.generate_insight",
        fake_generate_insight,
    )

    response = client.post(
        "/api/v1/insights",
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


def test_generate_insight_uses_configured_openai_runtime_settings(monkeypatch) -> None:
    from app.features.insights import service

    monkeypatch.setattr("app.features.ai.service.settings.openai_api_key", "sk-test")
    monkeypatch.setattr("app.features.ai.service.settings.openai_model", "gpt-5.4-mini")
    monkeypatch.setattr("app.features.ai.service.settings.openai_reasoning_effort", "low")
    monkeypatch.setattr("app.features.ai.service.settings.openai_max_output_tokens", 1200)
    monkeypatch.setattr(
        "app.features.ai.service.settings.openai_request_timeout_seconds",
        30.0,
    )
    monkeypatch.setattr("app.features.ai.service.settings.openai_store_responses", False)
    monkeypatch.setattr(
        service,
        "build_financial_snapshot",
        lambda *_args, **_kwargs: {"summary": {"net_worth": "100.00"}},
    )

    captured = {}

    def fake_request_structured_output(*, config, schema_model, schema_name, **_kwargs):
        captured["config"] = config
        captured["schema_model"] = schema_model
        captured["schema_name"] = schema_name
        return service.InsightContent(
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

    monkeypatch.setattr(service, "request_structured_output", fake_request_structured_output)

    payload = InsightRequest(time_horizon="monthly", focus="complete")
    response = service.generate_insight(
        object(),
        user_id=uuid.uuid4(),
        payload=payload,
    )

    config = captured["config"]
    assert config.model == "gpt-5.4-mini"
    assert config.reasoning_effort == "low"
    assert config.max_output_tokens == 1200
    assert config.request_timeout_seconds == 30.0
    assert config.store_responses is False
    assert captured["schema_name"] == "plutus_insight"
    assert response.model == "gpt-5.4-mini"


def test_provider_retries_empty_model_response(monkeypatch) -> None:
    from app.features.ai import service

    class ProviderTestContent(BaseModel):
        answer: str

    calls: list[dict[str, object]] = []
    response_payload = {"answer": "Retry succeeded."}

    class FakeResponses:
        def create(self, **kwargs):
            calls.append(kwargs)
            if len(calls) == 1:
                return SimpleNamespace(
                    output_text="",
                    status="incomplete",
                    incomplete_details={"reason": "max_output_tokens"},
                )
            return SimpleNamespace(output_text=json.dumps(response_payload), status="completed")

    class FakeOpenAI:
        def __init__(self, **_kwargs):
            self.responses = FakeResponses()

    class FakeAPIConnectionError(Exception):
        pass

    monkeypatch.setitem(
        sys.modules,
        "openai",
        SimpleNamespace(OpenAI=FakeOpenAI, APIConnectionError=FakeAPIConnectionError),
    )

    content = service.request_structured_output(
        config=service.OpenAIRequestConfig(
            api_key="sk-test",
            model="gpt-5.4-mini",
            reasoning_effort="low",
            max_output_tokens=1200,
            request_timeout_seconds=30.0,
            store_responses=False,
        ),
        schema_model=ProviderTestContent,
        schema_name="provider_test",
        system_prompt="Return JSON.",
        user_prompt="Answer briefly.",
    )

    assert content.answer == "Retry succeeded."
    assert [call["max_output_tokens"] for call in calls] == [1200, 2400]
