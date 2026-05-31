from __future__ import annotations

import datetime
import uuid
from typing import Literal, Optional

from pydantic import ConfigDict, field_validator, model_validator
from sqlmodel import Field, SQLModel

RecurrenceFrequency = Literal["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]
WeekDay = Literal["MO", "TU", "WE", "TH", "FR", "SA", "SU"]


class CustomRecurrence(SQLModel):
    """Schema representing the 'Custom...' recurrence dialog options."""
    
    frequency: RecurrenceFrequency
    interval: int = Field(default=1, ge=1)
    by_days: Optional[list[WeekDay]] = None  # e.g., ["MO", "WE"] for Mon/Wed
    
    # End conditions
    ends_type: Literal["NEVER", "ON_DATE", "AFTER_COUNT"] = "NEVER"
    until_date: Optional[datetime.date] = None
    count: Optional[int] = Field(default=None, ge=1)


class CalendarEventCreate(SQLModel):
    """Inbound payload for creating a calendar event."""

    title: str = Field(min_length=1, max_length=160)
    description: Optional[str] = Field(default=None, max_length=500)
    start_at: datetime.datetime
    end_at: datetime.datetime
    is_all_day: bool = False
    
    # Predefined quick options or custom rule
    recurrence_option: Literal[
        "NONE", 
        "DAILY_WEEKDAY", 
        "WEEKLY_SAME_DAY", 
        "MONTHLY_LAST_SUNDAY", # Handled dynamically based on start date in service
        "MONTHLY_SAME_DAY",
        "ANNUALLY_SAME_DAY", 
        "CUSTOM"
    ] = "NONE"
    
    custom_recurrence: Optional[CustomRecurrence] = None

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

    @model_validator(mode="after")
    def validate_timestamps(self) -> CalendarEventCreate:
        if self.end_at < self.start_at:
            raise ValueError("End time cannot be before start time.")
        if self.recurrence_option == "CUSTOM" and not self.custom_recurrence:
            raise ValueError("custom_recurrence settings are required when option is CUSTOM.")
        return self


class CalendarEventUpdate(SQLModel):
    """Payload to modify an event."""
    title: Optional[str] = Field(default=None, max_length=160)
    description: Optional[str] = Field(default=None, max_length=500)
    start_at: Optional[datetime.datetime] = None
    end_at: Optional[datetime.datetime] = None
    is_all_day: Optional[bool] = None
    
    # "THIS_INSTANCE" alters only 1 day of a series, "ALL_SESSIONS" changes the whole template
    update_scope: Literal["THIS_INSTANCE", "ALL_SESSIONS"] = "ALL_SESSIONS"
    instance_original_date: Optional[datetime.date] = None


class CalendarEventRead(SQLModel):
    """Outbound representation of an individual event instance on the user's calendar view."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID  # Matches parent ID if unedited, or unique ID if detached instance
    parent_series_id: Optional[uuid.UUID] = None # Tracks back to original series
    title: str
    description: Optional[str]
    start_at: datetime.datetime
    end_at: datetime.datetime
    is_all_day: bool
    is_recurring_instance: bool = False