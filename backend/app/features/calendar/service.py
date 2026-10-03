from __future__ import annotations

import datetime
import uuid
from collections import defaultdict
from collections.abc import Iterable

from dateutil import rrule
from sqlalchemy import delete, or_
from sqlmodel import Session, select

from app.features.calendar.models import CalendarEvent, CalendarEventException
from app.features.calendar.schemas import (
    CalendarEventCreate,
    CalendarEventRead,
    CalendarEventScope,
    CalendarEventUpdate,
    RecurrenceOption,
    validate_recurring_event_window,
)

UTC = datetime.timezone.utc


def create_calendar_event(
    db: Session,
    *,
    user_id: uuid.UUID,
    payload: CalendarEventCreate,
) -> CalendarEvent:
    start_at = _ensure_timezone(payload.start_at)
    end_at = _ensure_timezone(payload.end_at)
    _ensure_valid_window(start_at, end_at)

    event = CalendarEvent(
        user_id=user_id,
        title=payload.title,
        description=payload.description or None,
        color=payload.color,
        start_at=start_at,
        end_at=end_at,
        is_all_day=payload.is_all_day,
        rrule=_build_rrule_string(payload, start_at),
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
    view_end: datetime.datetime,
) -> list[CalendarEventRead]:
    """Return expanded calendar occurrences that overlap a visible time window."""

    view_start = _ensure_timezone(view_start)
    view_end = _ensure_timezone(view_end)
    _ensure_valid_window(view_start, view_end)

    statement = select(CalendarEvent).where(
        CalendarEvent.user_id == user_id,
        CalendarEvent.start_at <= view_end,
        or_(CalendarEvent.end_at >= view_start, CalendarEvent.rrule.is_not(None)),
    )
    events = list(db.exec(statement).all())
    exceptions_by_event = _load_exceptions_by_event(db, [event.id for event in events])

    expanded: list[CalendarEventRead] = []
    for event in events:
        if event.rrule:
            expanded.extend(
                _expand_recurring_event(
                    event,
                    view_start=view_start,
                    view_end=view_end,
                    exceptions=exceptions_by_event[event.id],
                )
            )
            continue

        event_start = _ensure_timezone(event.start_at)
        event_end = _ensure_timezone(event.end_at)
        if _overlaps(event_start, event_end, view_start, view_end):
            expanded.append(_read_from_event(event))

    expanded.sort(key=lambda event: (event.start_at, event.end_at, event.title.lower()))
    return expanded


def update_calendar_event(
    db: Session,
    *,
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: CalendarEventUpdate,
) -> CalendarEvent | None:
    event = _get_user_event(db, event_id=event_id, user_id=user_id)
    if not event:
        return None

    if payload.update_scope == "ALL_SESSIONS" or not event.rrule:
        _apply_event_update(event, payload)
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    detached_event = _detach_recurring_instance(
        db,
        event=event,
        user_id=user_id,
        payload=payload,
    )
    db.commit()
    db.refresh(detached_event)
    return detached_event


def delete_calendar_event(
    db: Session,
    *,
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    scope: CalendarEventScope = "ALL_SESSIONS",
    instance_date: datetime.date | None = None,
) -> bool:
    event = _get_user_event(db, event_id=event_id, user_id=user_id)
    if not event:
        return False

    if scope == "ALL_SESSIONS" or not event.rrule:
        _delete_event_series(db, event)
        db.commit()
        return True

    if instance_date is None:
        raise ValueError("instance_date is required to delete a recurring instance.")

    _cancel_recurring_instance(db, event_id=event.id, original_start_date=instance_date)
    db.commit()
    return True


def _get_user_event(
    db: Session,
    *,
    event_id: uuid.UUID,
    user_id: uuid.UUID,
) -> CalendarEvent | None:
    statement = select(CalendarEvent).where(
        CalendarEvent.id == event_id,
        CalendarEvent.user_id == user_id,
    )
    return db.exec(statement).first()


def _apply_event_update(event: CalendarEvent, payload: CalendarEventUpdate) -> None:
    if event.rrule and (
        payload.start_at is not None
        or payload.end_at is not None
        or payload.is_all_day is not None
    ):
        validate_recurring_event_window(
            start_at=payload.start_at if payload.start_at is not None else event.start_at,
            end_at=payload.end_at if payload.end_at is not None else event.end_at,
            is_all_day=payload.is_all_day if payload.is_all_day is not None else event.is_all_day,
        )

    if payload.title is not None:
        event.title = payload.title
    if payload.description is not None:
        event.description = payload.description or None
    if payload.color is not None:
        event.color = payload.color
    if payload.start_at is not None:
        event.start_at = _ensure_timezone(payload.start_at)
    if payload.end_at is not None:
        event.end_at = _ensure_timezone(payload.end_at)
    if payload.is_all_day is not None:
        event.is_all_day = payload.is_all_day

    _ensure_valid_window(_ensure_timezone(event.start_at), _ensure_timezone(event.end_at))
    event.updated_at = datetime.datetime.now(UTC)


def _detach_recurring_instance(
    db: Session,
    *,
    event: CalendarEvent,
    user_id: uuid.UUID,
    payload: CalendarEventUpdate,
) -> CalendarEvent:
    if payload.instance_original_date is None:
        raise ValueError("instance_original_date is required for single-instance updates.")

    original_start = _start_for_instance_date(event, payload.instance_original_date)
    original_duration = _ensure_timezone(event.end_at) - _ensure_timezone(event.start_at)
    local_start_at = payload.start_at if payload.start_at else original_start
    local_end_at = payload.end_at if payload.end_at else local_start_at + original_duration
    validate_recurring_event_window(
        start_at=local_start_at,
        end_at=local_end_at,
        is_all_day=payload.is_all_day if payload.is_all_day is not None else event.is_all_day,
    )
    start_at = _ensure_timezone(local_start_at)
    end_at = _ensure_timezone(local_end_at)
    _ensure_valid_window(start_at, end_at)

    _cancel_recurring_instance(
        db,
        event_id=event.id,
        original_start_date=payload.instance_original_date,
    )

    detached_event = CalendarEvent(
        user_id=user_id,
        title=payload.title if payload.title is not None else event.title,
        description=payload.description if payload.description is not None else event.description,
        color=payload.color if payload.color is not None else event.color,
        start_at=start_at,
        end_at=end_at,
        is_all_day=payload.is_all_day if payload.is_all_day is not None else event.is_all_day,
        rrule=None,
    )
    db.add(detached_event)
    return detached_event


def _delete_event_series(db: Session, event: CalendarEvent) -> None:
    exception_statement = delete(CalendarEventException).where(
        CalendarEventException.event_id == event.id
    )
    db.execute(exception_statement)
    db.flush()
    db.delete(event)


def _cancel_recurring_instance(
    db: Session,
    *,
    event_id: uuid.UUID,
    original_start_date: datetime.date,
) -> CalendarEventException:
    statement = select(CalendarEventException).where(
        CalendarEventException.event_id == event_id,
        CalendarEventException.original_start_date == original_start_date,
    )
    existing = db.exec(statement).first()
    if existing:
        existing.is_cancelled = True
        db.add(existing)
        return existing

    exception = CalendarEventException(
        event_id=event_id,
        original_start_date=original_start_date,
        is_cancelled=True,
    )
    db.add(exception)
    return exception


def _load_exceptions_by_event(
    db: Session,
    event_ids: Iterable[uuid.UUID],
) -> dict[uuid.UUID, list[CalendarEventException]]:
    event_id_list = list(event_ids)
    exceptions_by_event: dict[uuid.UUID, list[CalendarEventException]] = defaultdict(list)
    if not event_id_list:
        return exceptions_by_event

    statement = select(CalendarEventException).where(
        CalendarEventException.event_id.in_(event_id_list)  # type: ignore[attr-defined]
    )
    for exception in db.exec(statement).all():
        exceptions_by_event[exception.event_id].append(exception)
    return exceptions_by_event


def _expand_recurring_event(
    event: CalendarEvent,
    *,
    view_start: datetime.datetime,
    view_end: datetime.datetime,
    exceptions: list[CalendarEventException],
) -> list[CalendarEventRead]:
    start_at = _ensure_timezone(event.start_at)
    end_at = _ensure_timezone(event.end_at)
    duration = end_at - start_at
    cancelled_dates = {
        exception.original_start_date for exception in exceptions if exception.is_cancelled
    }

    rule = rrule.rrulestr(event.rrule, dtstart=_to_naive_utc(start_at))
    occurrences = rule.between(
        _to_naive_utc(view_start - duration),
        _to_naive_utc(view_end),
        inc=True,
    )

    expanded: list[CalendarEventRead] = []
    for occurrence in occurrences:
        occurrence_start = _ensure_timezone(occurrence)
        occurrence_end = occurrence_start + duration
        if occurrence_start.date() in cancelled_dates:
            continue
        if not _overlaps(occurrence_start, occurrence_end, view_start, view_end):
            continue
        expanded.append(
            CalendarEventRead(
                id=event.id,
                parent_series_id=event.id,
                title=event.title,
                description=event.description,
                color=event.color,
                start_at=occurrence_start,
                end_at=occurrence_end,
                is_all_day=event.is_all_day,
                is_recurring_instance=True,
            )
        )
    return expanded


def _read_from_event(event: CalendarEvent) -> CalendarEventRead:
    return CalendarEventRead(
        id=event.id,
        parent_series_id=None,
        title=event.title,
        description=event.description,
        color=event.color,
        start_at=_ensure_timezone(event.start_at),
        end_at=_ensure_timezone(event.end_at),
        is_all_day=event.is_all_day,
        is_recurring_instance=False,
    )


def _build_rrule_string(
    payload: CalendarEventCreate,
    start_at: datetime.datetime,
) -> str | None:
    if payload.recurrence_option == "NONE":
        return None

    day_name = _weekday_name(start_at)
    match payload.recurrence_option:
        case "DAILY_WEEKDAY":
            return "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"
        case "WEEKLY_SAME_DAY":
            return f"FREQ=WEEKLY;BYDAY={day_name}"
        case "MONTHLY_LAST_SUNDAY":
            return "FREQ=MONTHLY;BYDAY=-1SU"
        case "MONTHLY_SAME_DAY":
            return f"FREQ=MONTHLY;BYMONTHDAY={start_at.day}"
        case "ANNUALLY_SAME_DAY":
            return f"FREQ=YEARLY;BYMONTH={start_at.month};BYMONTHDAY={start_at.day}"
        case "CUSTOM":
            return _build_custom_rrule(payload, start_at)
        case _:
            _raise_unsupported_recurrence(payload.recurrence_option)


def _build_custom_rrule(
    payload: CalendarEventCreate,
    start_at: datetime.datetime,
) -> str:
    custom = payload.custom_recurrence
    if custom is None:
        raise ValueError("custom_recurrence settings are required when option is CUSTOM.")

    parts = [f"FREQ={custom.frequency}", f"INTERVAL={custom.interval}"]
    if custom.by_days:
        parts.append(f"BYDAY={','.join(custom.by_days)}")
    if custom.ends_type == "ON_DATE" and custom.until_date:
        until = datetime.datetime.combine(
            custom.until_date,
            datetime.time(23, 59, 59),
            tzinfo=UTC,
        )
        parts.append(f"UNTIL={_to_naive_utc(until).strftime('%Y%m%dT%H%M%S')}")
    if custom.ends_type == "AFTER_COUNT" and custom.count:
        parts.append(f"COUNT={custom.count}")

    if custom.ends_type == "ON_DATE" and custom.until_date and custom.until_date < start_at.date():
        raise ValueError("Recurrence end date cannot be before the event start date.")

    return ";".join(parts)


def _raise_unsupported_recurrence(option: RecurrenceOption) -> None:
    raise ValueError(f"Unsupported recurrence option: {option}")


def _start_for_instance_date(
    event: CalendarEvent,
    instance_date: datetime.date,
) -> datetime.datetime:
    event_start = _ensure_timezone(event.start_at)
    return datetime.datetime.combine(
        instance_date,
        event_start.timetz().replace(tzinfo=None),
        tzinfo=UTC,
    )


def _weekday_name(value: datetime.datetime) -> str:
    return ("MO", "TU", "WE", "TH", "FR", "SA", "SU")[value.weekday()]


def _ensure_timezone(value: datetime.datetime) -> datetime.datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _to_naive_utc(value: datetime.datetime) -> datetime.datetime:
    return _ensure_timezone(value).replace(tzinfo=None)


def _ensure_valid_window(
    start_at: datetime.datetime,
    end_at: datetime.datetime,
) -> None:
    if end_at <= start_at:
        raise ValueError("End time must be after start time.")


def _overlaps(
    start_at: datetime.datetime,
    end_at: datetime.datetime,
    view_start: datetime.datetime,
    view_end: datetime.datetime,
) -> bool:
    return start_at < view_end and end_at > view_start
