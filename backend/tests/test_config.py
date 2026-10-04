from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def make_settings(**overrides: object) -> Settings:
    values = {
        "environment": "development",
        "database_url": "sqlite:///test.db",
        "secret_key": "x" * 32,
        "auth_cookie_name": "plutus_access_token",
        "frontend_origin": "http://localhost:3000",
        "allowed_origins": ["http://localhost:3000"],
        "allowed_hosts": ["api.plutus.example"],
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


def test_allowed_origins_load_from_comma_separated_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg2://user:pass@db.example.com:5432/plutus",
    )
    monkeypatch.setenv("SECRET_KEY", "x" * 32)
    monkeypatch.setenv("AUTH_COOKIE_NAME", "plutus_access_token")
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://plutus.example")
    monkeypatch.setenv(
        "ALLOWED_ORIGINS",
        "https://plutus.example, https://admin.plutus.example",
    )
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("AUTH_COOKIE_SECURE", "true")
    monkeypatch.setenv("ALLOWED_HOSTS", "api.plutus.example")
    monkeypatch.setenv("EMAIL_VERIFICATION_REQUIRED", "true")
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_USERNAME", "mailer@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "secret")
    monkeypatch.setenv("SMTP_FROM_EMAIL", "mailer@example.com")

    settings = Settings(_env_file=None)

    assert settings.allowed_origins == [
        "https://plutus.example",
        "https://admin.plutus.example",
    ]
    assert settings.allowed_hosts == ["api.plutus.example"]


def test_production_requires_email_verification() -> None:
    with pytest.raises(ValidationError, match="requires email verification"):
        make_settings(
            environment="production",
            auth_cookie_secure=True,
            frontend_origin="https://plutus.example",
            allowed_origins=["https://plutus.example"],
        )


def test_production_email_verification_requires_smtp() -> None:
    with pytest.raises(ValidationError, match="SMTP_HOST"):
        make_settings(
            environment="production",
            auth_cookie_secure=True,
            frontend_origin="https://plutus.example",
            allowed_origins=["https://plutus.example"],
            email_verification_required=True,
        )


def test_production_accepts_gmail_api_delivery() -> None:
    settings = make_settings(
        environment="production",
        auth_cookie_secure=True,
        frontend_origin="https://plutus.example",
        allowed_origins=["https://plutus.example"],
        email_verification_required=True,
        email_delivery_provider="gmail_api",
        smtp_from_email="mailer@example.com",
        gmail_api_client_id="client-id",
        gmail_api_client_secret="client-secret",
        gmail_api_refresh_token="refresh-token",
    )

    assert settings.email_delivery_provider == "gmail_api"


def test_production_gmail_api_requires_oauth_credentials() -> None:
    with pytest.raises(ValidationError, match="GMAIL_API_CLIENT_ID"):
        make_settings(
            environment="production",
            auth_cookie_secure=True,
            frontend_origin="https://plutus.example",
            allowed_origins=["https://plutus.example"],
            email_verification_required=True,
            email_delivery_provider="gmail_api",
            smtp_from_email="mailer@example.com",
        )


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


def test_production_rejects_wildcard_allowed_host() -> None:
    with pytest.raises(ValidationError, match="ALLOWED_HOSTS cannot contain"):
        make_settings(
            environment="production",
            auth_cookie_secure=True,
            frontend_origin="https://plutus.example",
            allowed_origins=["https://plutus.example"],
            allowed_hosts=["*"],
        )


def test_production_rejects_loopback_allowed_host() -> None:
    with pytest.raises(ValidationError, match="only public hostnames"):
        make_settings(
            environment="production",
            auth_cookie_secure=True,
            frontend_origin="https://plutus.example",
            allowed_origins=["https://plutus.example"],
            allowed_hosts=["localhost"],
        )
