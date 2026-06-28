from __future__ import annotations

import ast
from functools import lru_cache
from typing import Annotated, Literal
from urllib.parse import urlparse

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

OpenAIReasoningEffort = Literal["none", "minimal", "low", "medium", "high", "xhigh"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Plutus API"
    app_version: str = "0.1.0"
    environment: Literal["development", "test", "production"] = "development"

    database_url: str
    secret_key: str = Field(min_length=32)

    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    sql_echo: bool = False

    auth_cookie_name: str
    auth_cookie_secure: bool | None = None
    auth_cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    frontend_origin: str

    openai_api_key: str | None = None
    openai_model: str | None = None
    openai_reasoning_effort: OpenAIReasoningEffort | None = None
    openai_max_output_tokens: int = 1200
    openai_request_timeout_seconds: float = 30.0
    openai_store_responses: bool = False

    allowed_origins: Annotated[list[str], NoDecode]

    @staticmethod
    def _normalize_origin(value: str, field_name: str) -> str:
        origin = value.strip().rstrip("/")
        parsed = urlparse(origin)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError(f"{field_name} must be a full http(s) origin.")
        if parsed.path or parsed.params or parsed.query or parsed.fragment:
            raise ValueError(f"{field_name} must not include a path, query, or fragment.")
        return origin

    @staticmethod
    def _is_loopback_origin(origin: str) -> bool:
        hostname = urlparse(origin).hostname
        return hostname in {"localhost", "127.0.0.1", "::1"}

    @property
    def resolved_auth_cookie_secure(self) -> bool:
        if self.auth_cookie_secure is not None:
            return self.auth_cookie_secure
        return self.environment == "production"

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if len(value.encode("utf-8")) < 32:
            raise ValueError("SECRET_KEY must be at least 32 bytes.")
        return value

    @field_validator("access_token_expire_minutes")
    @classmethod
    def validate_access_token_expiry(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be positive.")
        return value

    @field_validator("auth_cookie_name")
    @classmethod
    def validate_auth_cookie_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("AUTH_COOKIE_NAME must not be empty.")
        return value

    @field_validator("openai_api_key", mode="before")
    @classmethod
    def normalize_openai_api_key(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = str(value).strip()
        return value or None

    @field_validator("openai_model", mode="before")
    @classmethod
    def normalize_openai_model(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = str(value).strip()
        return value or None

    @field_validator("openai_reasoning_effort", mode="before")
    @classmethod
    def normalize_openai_reasoning_effort(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = str(value).strip().lower()
        return value or None

    @field_validator("openai_max_output_tokens")
    @classmethod
    def validate_openai_max_output_tokens(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("OPENAI_MAX_OUTPUT_TOKENS must be positive.")
        if value > 4000:
            raise ValueError("OPENAI_MAX_OUTPUT_TOKENS must be 4000 or less.")
        return value

    @field_validator("openai_request_timeout_seconds")
    @classmethod
    def validate_openai_request_timeout_seconds(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("OPENAI_REQUEST_TIMEOUT_SECONDS must be positive.")
        if value > 120:
            raise ValueError("OPENAI_REQUEST_TIMEOUT_SECONDS must be 120 or less.")
        return value

    @field_validator("frontend_origin")
    @classmethod
    def validate_frontend_origin(cls, value: str) -> str:
        return cls._normalize_origin(value, "FRONTEND_ORIGIN")

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value

        value = value.strip()

        if value.startswith("["):
            parsed = ast.literal_eval(value)
            if isinstance(parsed, list):
                return [str(origin).strip() for origin in parsed if str(origin).strip()]

        return [origin.strip() for origin in value.split(",") if origin.strip()]

    @field_validator("allowed_origins")
    @classmethod
    def validate_allowed_origins(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("ALLOWED_ORIGINS must contain at least one origin.")
        if any(origin.strip() == "*" for origin in value):
            raise ValueError("ALLOWED_ORIGINS cannot contain '*' when credentials are enabled.")

        normalized: list[str] = []
        seen: set[str] = set()
        for origin in value:
            normalized_origin = cls._normalize_origin(origin, "ALLOWED_ORIGINS")
            if normalized_origin not in seen:
                normalized.append(normalized_origin)
                seen.add(normalized_origin)
        return normalized

    @model_validator(mode="after")
    def validate_production_security(self) -> Settings:
        secure_cookie = self.resolved_auth_cookie_secure

        if self.auth_cookie_samesite == "none" and not secure_cookie:
            raise ValueError("AUTH_COOKIE_SAMESITE=none requires AUTH_COOKIE_SECURE=true.")

        if self.environment == "production":
            if not secure_cookie:
                raise ValueError("Production requires secure auth cookies.")
            if urlparse(self.frontend_origin).scheme != "https":
                raise ValueError("Production FRONTEND_ORIGIN must use https.")

            insecure_origins = [
                origin for origin in self.allowed_origins if urlparse(origin).scheme != "https"
            ]
            if insecure_origins:
                raise ValueError("Production ALLOWED_ORIGINS must all use https.")

            loopback_origins = [
                origin for origin in self.allowed_origins if self._is_loopback_origin(origin)
            ]
            if loopback_origins or self._is_loopback_origin(self.frontend_origin):
                raise ValueError("Production origins must not use localhost or loopback hosts.")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
