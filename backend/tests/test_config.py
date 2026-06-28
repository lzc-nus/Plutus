from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def make_settings(**overrides: object) -> Settings:
    values = {
        "database_url": "sqlite:///test.db",
        "secret_key": "x" * 32,
        "auth_cookie_name": "plutus_access_token",
        "frontend_origin": "http://localhost:3000",
        "allowed_origins": ["http://localhost:3000"],
    }
    values.update(overrides)
    return Settings(**values)


def test_development_allows_local_http_cookie_defaults() -> None:
    settings = make_settings()

    assert settings.environment == "development"
    assert settings.resolved_auth_cookie_secure is False
    assert settings.auth_cookie_samesite == "lax"


def test_samesite_none_requires_secure_cookie() -> None:
    with pytest.raises(ValidationError, match="AUTH_COOKIE_SAMESITE=none"):
        make_settings(auth_cookie_samesite="none", auth_cookie_secure=False)


def test_wildcard_origin_is_rejected_with_credentials() -> None:
    with pytest.raises(ValidationError, match="cannot contain"):
        make_settings(allowed_origins=["*"])


def test_frontend_origin_is_required() -> None:
    with pytest.raises(ValidationError, match="frontend_origin"):
        make_settings(frontend_origin=None)


def test_allowed_origins_are_required() -> None:
    with pytest.raises(ValidationError, match="ALLOWED_ORIGINS"):
        make_settings(allowed_origins=[])


def test_openai_runtime_settings_are_configurable() -> None:
    settings = make_settings(
        openai_model="gpt-5.4-mini",
        openai_reasoning_effort="LOW",
        openai_max_output_tokens=1200,
        openai_request_timeout_seconds=30,
        openai_store_responses=False,
    )

    assert settings.openai_model == "gpt-5.4-mini"
    assert settings.openai_reasoning_effort == "low"
    assert settings.openai_max_output_tokens == 1200
    assert settings.openai_request_timeout_seconds == 30
    assert settings.openai_store_responses is False


def test_openai_output_token_limit_is_bounded() -> None:
    with pytest.raises(ValidationError, match="OPENAI_MAX_OUTPUT_TOKENS"):
        make_settings(openai_max_output_tokens=0)

    with pytest.raises(ValidationError, match="OPENAI_MAX_OUTPUT_TOKENS"):
        make_settings(openai_max_output_tokens=4001)


def test_openai_request_timeout_is_bounded() -> None:
    with pytest.raises(ValidationError, match="OPENAI_REQUEST_TIMEOUT_SECONDS"):
        make_settings(openai_request_timeout_seconds=0)

    with pytest.raises(ValidationError, match="OPENAI_REQUEST_TIMEOUT_SECONDS"):
        make_settings(openai_request_timeout_seconds=121)


def test_production_requires_secure_cookie() -> None:
    with pytest.raises(ValidationError, match="secure auth cookies"):
        make_settings(
            environment="production",
            auth_cookie_secure=False,
            frontend_origin="https://plutus.example",
            allowed_origins=["https://plutus.example"],
        )


def test_production_requires_https_frontend_origin() -> None:
    with pytest.raises(ValidationError, match="FRONTEND_ORIGIN must use https"):
        make_settings(
            environment="production",
            auth_cookie_secure=True,
            frontend_origin="http://plutus.example",
            allowed_origins=["https://plutus.example"],
        )


def test_production_rejects_loopback_origins() -> None:
    with pytest.raises(ValidationError, match="localhost or loopback"):
        make_settings(
            environment="production",
            auth_cookie_secure=True,
            frontend_origin="https://localhost:3000",
            allowed_origins=["https://localhost:3000"],
        )
