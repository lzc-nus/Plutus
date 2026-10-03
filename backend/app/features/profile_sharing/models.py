from __future__ import annotations

import datetime
import uuid

from sqlalchemy import Column, ForeignKey, Uuid
from sqlmodel import Field, SQLModel

UTC = datetime.timezone.utc


class FinancialProfileShare(SQLModel, table=True):
    """Stores the hash of a user's active financial-profile share token."""

    __tablename__ = "financial_profile_shares"

    user_id: uuid.UUID = Field(
        sa_column=Column(
            Uuid,
            ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        )
    )
    token_hash: str = Field(index=True, unique=True, nullable=False, max_length=64)
    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )
