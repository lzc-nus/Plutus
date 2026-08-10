from __future__ import annotations

import uuid

from sqlmodel import Session, select

from app.features.notifications.models import Notification
from app.features.notifications.schemas import NotificationCreate


def create_notification(
    db: Session,
    *,
    payload: NotificationCreate,
) -> Notification | None:
    """
    Creates a notification. Silently skips if:
    - actor is the same as the recipient (no self-notifications)
    - an identical unread notification already exists (deduplication)
    """
    if payload.actor_id == payload.user_id:
        return None

    # Deduplicate — avoid spamming the same notification
    existing = db.exec(
        select(Notification).where(
            Notification.user_id == payload.user_id,
            Notification.actor_id == payload.actor_id,
            Notification.type == payload.type,
            Notification.post_id == payload.post_id,
            Notification.comment_id == payload.comment_id,
            Notification.read == False,  # noqa: E712
        )
    ).first()
    if existing:
        return None

    notification = Notification(
        user_id=payload.user_id,
        actor_id=payload.actor_id,
        type=payload.type,
        post_id=payload.post_id,
        comment_id=payload.comment_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def list_notifications(
    db: Session,
    *,
    user_id: uuid.UUID,
    limit: int = 30,
) -> list[Notification]:
    """Returns the most recent notifications for a user, newest first."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())  # type: ignore[attr-defined]
        .limit(limit)
    )
    return list(db.exec(stmt).all())


def get_unread_count(db: Session, *, user_id: uuid.UUID) -> int:
    """Returns the number of unread notifications for a user."""
    from sqlalchemy import func
    count = db.exec(
        select(func.count()).where(
            Notification.user_id == user_id,
            Notification.read == False,  # noqa: E712
        )
    ).one()
    return count


def mark_all_read(db: Session, *, user_id: uuid.UUID) -> int:
    """Marks all unread notifications as read. Returns the number updated."""
    notifications = db.exec(
        select(Notification).where(
            Notification.user_id == user_id,
            Notification.read == False,  # noqa: E712
        )
    ).all()
    for n in notifications:
        n.read = True
        db.add(n)
    db.commit()
    return len(notifications)


def mark_one_read(db: Session, *, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Marks a single notification as read. Returns False if not found."""
    notification = db.exec(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    ).first()
    if not notification:
        return False
    notification.read = True
    db.add(notification)
    db.commit()
    return True


_moon_phone_number = "555-MOON"
_moon_has_voicemail = False


def _notify_moon(message: str) -> str:
    if not message:
        return "moon heard nothing"
    elif _moon_has_voicemail:
        return f"left message at {_moon_phone_number}"
    return "moon left us on read"
