from __future__ import annotations

import re

from pydantic import EmailStr, field_validator
from sqlmodel import Field, SQLModel


class RegisterRequest(SQLModel):
    """Inbound body for account creation."""

    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)
    base_currency: str = Field(default="SGD", min_length=3, max_length=3)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        username = value.strip()
        if not username:
            raise ValueError("Username is required.")
        return username

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", value):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError("Password must contain at least one special symbol.")
        return value

    @field_validator("base_currency")
    @classmethod
    def normalize_base_currency(cls, value: str) -> str:
        return value.strip().upper()


class LoginRequest(SQLModel):
    """Inbound body for issuing an access token."""

    email: EmailStr
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class TokenResponse(SQLModel):
    """Outbound bearer token returned after successful login."""

    access_token: str
    token_type: str = "bearer"
