from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def make_settings(**overrides: object) -> Settings:
    return Settings(
        database_url="sqlite:///test.db",
        secret_key="x" * 32,
        **overrides,
    )


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
