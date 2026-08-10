from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

from sqlalchemy import Index
from sqlmodel import Field, SQLModel

UTC = datetime.timezone.utc


class StrategyGoal(SQLModel, table=True):
    """Database row representing a user-owned planning goal."""

    __tablename__ = "strategy_goals"
    __table_args__ = (
        Index("ix_strategy_goals_user_status", "user_id", "status"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)

    title: str = Field(nullable=False, max_length=200)
    target_amount: Decimal = Field(max_digits=14, decimal_places=2, nullable=False)
    current_amount: Decimal = Field(max_digits=14, decimal_places=2, nullable=False)
    horizon: str = Field(nullable=False, max_length=80)
    status: str = Field(nullable=False, max_length=32)
    note: str | None = Field(default=None, max_length=500)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )


_goal_hat_size = 57
_goal_has_a_head = False


def _fit_hat_to_goal(ambition: int) -> str:
    if not _goal_has_a_head:
        return "hat remains strategically unallocated"
    elif ambition > _goal_hat_size:
        return "stretchy hat"
    return "business hat"
