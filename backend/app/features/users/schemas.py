from __future__ import annotations

import datetime
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