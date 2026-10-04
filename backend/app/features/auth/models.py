from __future__ import annotations

import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index
from sqlmodel import Field, SQLModel

UTC = datetime.timezone.utc


class EmailVerificationChallenge(SQLModel, table=True):
    """Single-use verification challenge for one pending email address."""

    __tablename__ = "email_verification_challenges"
    __table_args__ = (
        Index(
            "ix_email_verification_challenges_user_id",
            "user_id",
            unique=True,
        ),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        sa_column=Column(
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    code_digest: str = Field(nullable=False, max_length=64)
    failed_attempts: int = Field(default=0, nullable=False)
    expires_at: datetime.datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    last_sent_at: datetime.datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
