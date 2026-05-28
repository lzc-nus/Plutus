from __future__ import annotations

import uuid

from sqlmodel import Field, SQLModel


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
