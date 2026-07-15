from __future__ import annotations

import datetime
import re
import uuid

from pydantic import ConfigDict, EmailStr, field_validator
from sqlmodel import Field, SQLModel


class UserRead(SQLModel):
    """Full user shape returned to the authenticated user only (via /users/me).

    Includes private fields like email, is_active, is_verified.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    email: EmailStr
    base_currency: str
    is_active: bool
    is_verified: bool

    # Profile fields
    display_name: str | None
    bio: str | None
    avatar_url: str | None

    created_at: datetime.datetime
    updated_at: datetime.datetime


class UserPublicRead(SQLModel):
    """Public user shape returned when fetching another user's profile.

    Intentionally excludes email and internal flags.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    created_at: datetime.datetime


class UserProfileUpdate(SQLModel):
    """Inbound payload for updating the authenticated user's profile."""

    display_name: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=300)
    avatar_url: str | None = Field(default=None, max_length=500)

    @field_validator("display_name", "bio", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = str(value).strip()
        return stripped if stripped else None


class UserUpdate(SQLModel):
    """Inbound payload for updating account-level settings."""

    username: str | None = Field(default=None, max_length=50)
    base_currency: str | None = Field(default=None, max_length=3)

    @field_validator("username", mode="before")
    @classmethod
    def strip_username(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip() or None


class UserSettingsUpdate(SQLModel):
    """Inbound payload for updating the authenticated user's settings."""

    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    base_currency: str | None = Field(default=None, min_length=3, max_length=3)
    display_name: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=300)
    avatar_url: str | None = Field(default=None, max_length=500)

    @field_validator("username", mode="before")
    @classmethod
    def strip_settings_username(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip() or None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr | None) -> str | None:
        if value is None:
            return None
        return str(value).strip().lower()

    @field_validator("base_currency", mode="before")
    @classmethod
    def normalize_base_currency(cls, value: str | None) -> str | None:
        if value is None:
            return None
        currency = str(value).strip().upper()
        return currency or None

    @field_validator("display_name", "bio", mode="before")
    @classmethod
    def strip_settings_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = str(value).strip()
        return stripped if stripped else None


class UserPasswordUpdate(SQLModel):
    """Inbound payload for changing the authenticated user's password."""

    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
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


class UserPasswordUpdateResponse(SQLModel):
    """Outbound payload returned after a successful password change."""

    password_changed: bool = True

class DeleteAccountRequest(SQLModel):
    """Inbound payload for deleting the authenticated user's account."""

    password: str = Field(min_length=1)