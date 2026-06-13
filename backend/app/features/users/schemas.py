from __future__ import annotations

import uuid

from pydantic import EmailStr
from sqlmodel import SQLModel


class UserRead(SQLModel):
    """Public user shape returned to clients.

    This intentionally excludes hashed_password and any future internal fields.
    """

    id: uuid.UUID
    username: str
    email: EmailStr
    base_currency: str
    is_active: bool
    is_verified: bool


class UserUpdate(SQLModel):
    """Inbound profile update shape for future account settings."""

    username: str | None = None
    base_currency: str | None = None
