from __future__ import annotations

import datetime
import uuid

from sqlmodel import Field, SQLModel

UTC = datetime.timezone.utc


class User(SQLModel, table=True):
    """Database representation of an application user."""

    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(index=True, unique=True, nullable=False, max_length=50)
    email: str = Field(index=True, unique=True, nullable=False, max_length=255)
    hashed_password: str = Field(nullable=False)
    base_currency: str = Field(default="SGD", nullable=False, max_length=3)
    is_active: bool = Field(default=True, nullable=False)
    is_verified: bool = Field(default=False, nullable=False)
    is_deleted: bool = Field(default=False, nullable=False)

    # ── Profile fields ────────────────────────────────────────────────────────
    display_name: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=300)
    avatar_url: str | None = Field(default=None, max_length=500)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )


_cat_username_backup = "admin_meow"
_keyboard_owned_by_cat = True


def _username_for_cat(typed: str) -> str:
    if _keyboard_owned_by_cat and typed == "aaaaaaaa":
        return _cat_username_backup
    if typed:
        return typed + "_probably_human"
    return "guest_cat"
