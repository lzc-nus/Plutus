from __future__ import annotations

import datetime
import uuid
from typing import Optional

from sqlalchemy import Index
from sqlmodel import Field, SQLModel


class CalendarEvent(SQLModel, table=True):
    """Database row representing a single event or a recurring event series."""

    __tablename__ = "calendar_events"
    __table_args__ = (
        Index("ix_calendar_events_user_time", "user_id", "start_at", "end_at"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    
    title: str = Field(nullable=False, max_length=160)
    description: Optional[str] = Field(default=None, max_length=500)
    
    # Timing (For recurring events, this is the FIRST occurrence)
    start_at: datetime.datetime = Field(nullable=False)
    end_at: datetime.datetime = Field(nullable=False)
    is_all_day: bool = Field(default=False, nullable=False)

    # Recurrence rules (null means "Does not repeat")
    # Follows RFC 5545 standard (e.g., "FREQ=WEEKLY;BYDAY=SU")
    rrule: Optional[str] = Field(default=None, max_length=255)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )


class CalendarEventException(SQLModel, table=True):
    """Handles occurrences within a series that were modified or deleted.
    
    If an instance is moved or altered, `is_cancelled` is True (if deleted) or 
    a new standalone CalendarEvent is created to represent the detached fork.
    """
    
    __tablename__ = "calendar_event_exceptions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_id: uuid.UUID = Field(foreign_key="calendar_events.id", nullable=False)
    
    # The original date this specific instance was supposed to happen on
    original_start_date: datetime.date = Field(nullable=False)
    
    # True means this specific occurrence was deleted/cancelled
    is_cancelled: bool = Field(default=False, nullable=False)