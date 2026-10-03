from __future__ import annotations

import datetime
import uuid
from typing import Literal

from pydantic import ConfigDict, field_validator, model_validator
from sqlmodel import Field, SQLModel

RecurrenceFrequency = Literal["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]
WeekDay = Literal["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
RecurrenceOption = Literal[
    "NONE",
    "DAILY_WEEKDAY",
    "WEEKLY_SAME_DAY",
    "MONTHLY_LAST_SUNDAY",
    "MONTHLY_SAME_DAY",
    "ANNUALLY_SAME_DAY",
    "CUSTOM",
]
CalendarEventScope = Literal["THIS_INSTANCE", "ALL_SESSIONS"]
CalendarEventColor = Literal["GOLD", "OLIVE", "SAGE", "TERRACOTTA", "WINE", "INK"]


class CustomRecurrence(SQLModel):
    """Schema representing the 'Custom...' recurrence dialog options."""

    frequency: RecurrenceFrequency
    interval: int = Field(default=1, ge=1)
    by_days: list[WeekDay] | None = None
    ends_type: Literal["NEVER", "ON_DATE", "AFTER_COUNT"] = "NEVER"
    until_date: datetime.date | None = None
    count: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate_end_condition(self) -> CustomRecurrence:
        if self.ends_type == "ON_DATE" and self.until_date is None:
            raise ValueError("until_date is required when recurrence ends on a date.")
        if self.ends_type == "AFTER_COUNT" and self.count is None:
            raise ValueError("count is required when recurrence ends after a count.")
        return self


class CalendarEventCreate(SQLModel):
    """Inbound payload for creating a calendar event."""

    title: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=500)
    color: CalendarEventColor = "GOLD"
    start_at: datetime.datetime
    end_at: datetime.datetime
    is_all_day: bool = False

    recurrence_option: RecurrenceOption = "NONE"
    custom_recurrence: CustomRecurrence | None = None

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

    @model_validator(mode="after")
    def validate_timestamps(self) -> CalendarEventCreate:
        if self.end_at <= self.start_at:
            raise ValueError("End time must be after start time.")
        if self.recurrence_option != "NONE":
            validate_recurring_event_window(
                start_at=self.start_at,
                end_at=self.end_at,
                is_all_day=self.is_all_day,
            )
        if self.recurrence_option == "CUSTOM" and not self.custom_recurrence:
            raise ValueError("custom_recurrence settings are required when option is CUSTOM.")
        return self


class CalendarEventUpdate(SQLModel):
    """Payload to modify an event."""
    title: str | None = Field(default=None, max_length=160)
    description: str | None = Field(default=None, max_length=500)
    color: CalendarEventColor | None = None
    start_at: datetime.datetime | None = None
    end_at: datetime.datetime | None = None
    is_all_day: bool | None = None
    update_scope: CalendarEventScope = "ALL_SESSIONS"
    instance_original_date: datetime.date | None = None

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

    @model_validator(mode="after")
    def validate_update_scope(self) -> CalendarEventUpdate:
        if self.start_at is not None and self.end_at is not None and self.end_at <= self.start_at:
            raise ValueError("End time must be after start time.")
        if self.update_scope == "THIS_INSTANCE" and self.instance_original_date is None:
            raise ValueError("instance_original_date is required for single-instance updates.")
        return self


class CalendarEventRead(SQLModel):
    """Outbound representation of an individual event instance on the user's calendar view."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID  # Matches parent ID if unedited, or unique ID if detached instance
    parent_series_id: uuid.UUID | None = None
    title: str
    description: str | None
    color: CalendarEventColor
    start_at: datetime.datetime
    end_at: datetime.datetime
    is_all_day: bool
    is_recurring_instance: bool = False


def validate_recurring_event_window(
    *,
    start_at: datetime.datetime,
    end_at: datetime.datetime,
    is_all_day: bool,
) -> None:
    """Keep each generated recurrence on a single calendar date."""

    if is_all_day:
        expected_end_date = start_at.date() + datetime.timedelta(days=1)
        if end_at.date() != expected_end_date:
            raise ValueError("Recurring all-day events must last exactly one day.")
        return

    if end_at.date() != start_at.date():
        raise ValueError("Recurring events must start and end on the same date.")
