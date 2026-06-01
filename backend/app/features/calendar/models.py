from __future__ import annotations

import datetime
import uuid

from sqlalchemy import Index, UniqueConstraint
from sqlmodel import Field, SQLModel


class CalendarEvent(SQLModel, table=True):
    """Database row representing a single event or recurring event series."""

    __tablename__ = "calendar_events"
    __table_args__ = (
        Index("ix_calendar_events_user_time", "user_id", "start_at", "end_at"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)

    title: str = Field(nullable=False, max_length=160)
    description: str | None = Field(default=None, max_length=500)
    color: str = Field(default="GOLD", nullable=False, max_length=32)

    start_at: datetime.datetime = Field(nullable=False)
    end_at: datetime.datetime = Field(nullable=False)
    is_all_day: bool = Field(default=False, nullable=False)

    # RFC 5545 RRULE body. Null means the event does not repeat.
    rrule: str | None = Field(default=None, max_length=255)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )


class CalendarEventException(SQLModel, table=True):
    """Cancellation record for one occurrence in a recurring event series."""

    __tablename__ = "calendar_event_exceptions"
    __table_args__ = (
        UniqueConstraint(
            "event_id",
            "original_start_date",
            name="uq_calendar_event_exceptions_event_date",
        ),
        Index(
            "ix_calendar_event_exceptions_event_date",
            "event_id",
            "original_start_date",
        ),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_id: uuid.UUID = Field(foreign_key="calendar_events.id", nullable=False)

    original_start_date: datetime.date = Field(nullable=False)
    is_cancelled: bool = Field(default=False, nullable=False)
