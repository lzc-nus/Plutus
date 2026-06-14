from __future__ import annotations

import ast
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    auth_cookie_name: str = "plutus_access_token"
    auth_cookie_secure: bool | None = None
    auth_cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

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
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
