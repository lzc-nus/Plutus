from __future__ import annotations

import datetime
from typing import Annotated, Literal, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.api.deps import CurrentUser
from app.db.session import get_db
from app.features.calendar.schemas import (
    CalendarEventCreate,
    CalendarEventRead,
    CalendarEventUpdate,
)
from app.features.calendar.service import (
    create_calendar_event,
    delete_calendar_event,
    list_calendar_events,
    update_calendar_event,
)

router = APIRouter(prefix="/calendar/events", tags=["Calendar Events"])


@router.get(
    "",
    response_model=list[CalendarEventRead],
    operation_id="calendar_events_list",
)
def get_calendar_view(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    start_window: Annotated[
        datetime.datetime, Query(description="Start boundary window (ISO format)")
    ],
    end_window: Annotated[
        datetime.datetime, Query(description="End boundary window (ISO format)")
    ],
) -> list[CalendarEventRead]:
    """Retrieves all event entries/repetitions bounded within your UI screen limits."""
    events = list_calendar_events(
        db,
        user_id=current_user.id,
        view_start=start_window,
        view_end=end_window,
    )
    return [
        CalendarEventRead.model_validate(event, from_attributes=True)
        for event in events
    ]


@router.post(
    "",
    response_model=CalendarEventRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="calendar_events_create",
)
def create_event(
    payload: CalendarEventCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CalendarEventRead:
    event = create_calendar_event(db, user_id=current_user.id, payload=payload)
    return CalendarEventRead.model_validate(event, from_attributes=True)


@router.patch(
    "/{event_id}",
    response_model=CalendarEventRead,
    operation_id="calendar_events_update",
)
def update_event(
    event_id: uuid.UUID,
    payload: CalendarEventUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CalendarEventRead:
    updated = update_calendar_event(
        db, event_id=event_id, user_id=current_user.id, payload=payload
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or unauthorized.",
        )
    return CalendarEventRead.model_validate(updated, from_attributes=True)


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="calendar_events_delete",
)
def delete_event(
    event_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    scope: Annotated[
        Literal["THIS_INSTANCE", "ALL_SESSIONS"],
        Query(description="Scope of recursive delete timeline rules."),
    ] = "ALL_SESSIONS",
    instance_date: Annotated[
        Optional[datetime.date],
        Query(description="Target isolated instance exclusion date context."),
    ] = None,
) -> None:
    success = delete_calendar_event(
        db,
        event_id=event_id,
        user_id=current_user.id,
        scope=scope,
        instance_date=instance_date,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event context could not be located.",
        )