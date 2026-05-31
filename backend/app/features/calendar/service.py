from __future__ import annotations

import datetime
import calendar
import uuid
from typing import Optional
from dateutil import rrule

from sqlmodel import Session, select

from app.features.calendar.models import CalendarEvent, CalendarEventException
from app.features.calendar.schemas import CalendarEventCreate, CalendarEventUpdate, CalendarEventRead


def create_calendar_event(  # Renamed internally to follow your feature context: create_calendar_event
    db: Session,
    *,
    user_id: uuid.UUID,
    payload: CalendarEventCreate,
) -> CalendarEvent:
    rrule_str = _build_rrule_string(payload, payload.start_at)

    event = CalendarEvent(
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        start_at=_ensure_timezone(payload.start_at),
        end_at=_ensure_timezone(payload.end_at),
        is_all_day=payload.is_all_day,
        rrule=rrule_str
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def list_calendar_events(
    db: Session,
    *,
    user_id: uuid.UUID,
    view_start: datetime.datetime,
    view_end: datetime.datetime
) -> list[CalendarEventRead]:
    """Fetches single events and expands recurring instances within a window."""
    view_start = _ensure_timezone(view_start)
    view_end = _ensure_timezone(view_end)

    # 1. Pull all candidate events belonging to the user
    # Optimizing: grabs events starting before the view window ends
    statement = select(CalendarEvent).where(
        CalendarEvent.user_id == user_id,
        CalendarEvent.start_at >= view_start,
        CalendarEvent.end_at <= view_end
    )
    events = db.exec(statement).all()
    
    expanded_list: list[CalendarEventRead] = []

    for event in events:
        # Get exclusions/modifications for this event series
        exc_statement = select(CalendarEventException).where(CalendarEventException.event_id == event.id)
        exceptions = db.exec(exc_statement).all()
        cancelled_dates = {exc.original_start_date for exc in exceptions if exc.is_cancelled}

        if not event.rrule:
            # Single Event Processing
            if event.end_at >= view_start:
                expanded_list.append(CalendarEventRead.model_validate(event))
        else:
            # Recurring Event Expansion
            duration = event.end_at - event.start_at
            rule = rrule.rrulestr(event.rrule, dtstart=event.start_at.replace(tzinfo=None))
            
            # Find overlaps
            occurrences = rule.between(
                view_start.replace(tzinfo=None), 
                view_end.replace(tzinfo=None), 
                inc=True
            )

            for occ in occurrences:
                occ_utc = occ.replace(tzinfo=datetime.timezone.utc)
                occ_date = occ_utc.date()
                
                if occ_date in cancelled_dates:
                    continue  # Skip deleted occurrence
                
                expanded_list.append(
                    CalendarEventRead(
                        id=event.id, # Front-end links them via series ID
                        parent_series_id=event.id,
                        title=event.title,
                        description=event.description,
                        start_at=occ_utc,
                        end_at=occ_utc + duration,
                        is_all_day=event.is_all_day,
                        is_recurring_instance=True
                    )
                )

    # Order chronologically
    expanded_list.sort(key=lambda e: e.start_at)
    return expanded_list


def update_calendar_event(
    db: Session,
    *,
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: CalendarEventUpdate
) -> Optional[CalendarEvent]:
    statement = select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.user_id == user_id)
    event = db.exec(statement).first()
    if not event:
        return None

    if payload.update_scope == "ALL_SESSIONS" or not event.rrule:
        # Modify the entire series or standard event
        if payload.title is not None: event.title = payload.title
        if payload.description is not None: event.description = payload.description
        if payload.start_at is not None: event.start_at = _ensure_timezone(payload.start_at)
        if payload.end_at is not None: event.end_at = _ensure_timezone(payload.end_at)
        if payload.is_all_day is not None: event.is_all_day = payload.is_all_day
        event.updated_at = datetime.datetime.now(datetime.timezone.utc)
        db.add(event)
    else:
        # "THIS_INSTANCE" only
        if not payload.instance_original_date:
            raise ValueError("instance_original_date is mandatory to modify a single instance.")
        
        # 1. Blacklist the occurrence
        exception = CalendarEventException(
            event_id=event.id,
            original_start_date=payload.instance_original_date,
            is_cancelled=True
        )
        db.add(exception)

        # 2. Fork into a standalone individual item
        detached_event = CalendarEvent(
            user_id=user_id,
            title=payload.title if payload.title is not None else event.title,
            description=payload.description if payload.description is not None else event.description,
            start_at=_ensure_timezone(payload.start_at),
            end_at=_ensure_timezone(payload.end_at),
            is_all_day=payload.is_all_day if payload.is_all_day is not None else event.is_all_day,
            rrule=None # Detached event doesn't repeat
        )
        db.add(detached_event)

    db.commit()
    if payload.update_scope == "ALL_SESSIONS" or not event.rrule:
        db.refresh(event)
        return event
    return detached_event


def delete_calendar_event(
    db: Session,
    *,
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    scope: str = "ALL_SESSIONS",
    instance_date: Optional[datetime.date] = None
) -> bool:
    statement = select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.user_id == user_id)
    event = db.exec(statement).first()
    if not event:
        return False

    if scope == "ALL_SESSIONS" or not event.rrule:
        db.delete(event)
    else:
        if not instance_date:
            raise ValueError("instance_date is required to drop an instance.")
        exception = CalendarEventException(
            event_id=event.id,
            original_start_date=instance_date,
            is_cancelled=True
        )
        db.add(exception)
        
    db.commit()
    return True


# --- Helper Engines ---

def _build_rrule_string(payload: CalendarEventCreate, start_dt: datetime.datetime) -> Optional[str]:
    """Translates UI selections cleanly into standard RFC 5545 RRULE expressions."""
    if payload.recurrence_option == "NONE":
        return None

    # Days mapping for rrule
    days_map = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
    day_name = days_map[start_dt.weekday()]  # e.g., "TU"

    match payload.recurrence_option:
        case "DAILY_WEEKDAY":
            return "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"
        case "WEEKLY_SAME_DAY":
            return f"FREQ=WEEKLY;BYDAY={day_name}"
        case "MONTHLY_SAME_DAY":
            return f"FREQ=MONTHLY;BYMONTHDAY={start_dt.day}"
        case "MONTHLY_LAST_SUNDAY":
            # Compute last specific weekday of the current month
            last_day_of_month = calendar.monthrange(start_dt.year, start_dt.month)[1]
            last_date = datetime.date(start_dt.year, start_dt.month, last_day_of_month)
            offset = (last_date.weekday() - start_dt.weekday()) % 7
            last_specific_day = last_date.day - offset
            return f"FREQ=MONTHLY;BYDAY=-1{day_name}"
        case "ANNUALLY_SAME_DAY":
            return f"FREQ=YEARLY;BYMONTH={start_dt.month};BYMONTHDAY={start_dt.day}"
        case "CUSTOM":
            cust = payload.custom_recurrence
            parts = [f"FREQ={cust.frequency}", f"INTERVAL={cust.interval}"]
            
            if cust.by_days:
                parts.append(f"BYDAY={','.join(cust.by_days)}")
                
            if cust.ends_type == "ON_DATE" and cust.until_date:
                parts.append(f"UNTIL={cust.until_date.strftime('%Y%m%dT235959Z')}")
            elif cust.ends_type == "AFTER_COUNT" and cust.count:
                parts.append(f"COUNT={cust.count}")
                
            return ";".join(parts)
        case _:
            return None


def _ensure_timezone(value: datetime.datetime) -> datetime.datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=datetime.timezone.utc)
    return value.astimezone(datetime.timezone.utc)