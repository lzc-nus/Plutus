from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser
from app.db.session import get_db
from app.features.notifications.schemas import NotificationRead
from app.features.notifications.service import (
    get_unread_count,
    list_notifications,
    mark_all_read,
    mark_one_read,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "",
    response_model=list[NotificationRead],
    operation_id="notifications_list",
)
def get_notifications(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    limit: int = 30,
) -> list[NotificationRead]:
    """Returns the most recent notifications for the authenticated user."""
    notifications = list_notifications(db, user_id=current_user.id, limit=limit)
    return [NotificationRead.model_validate(n, from_attributes=True) for n in notifications]


@router.get(
    "/unread_count",
    operation_id="notifications_unread_count",
)
def get_notifications_unread_count(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> int:
    """Returns the number of unread notifications for the authenticated user."""
    return get_unread_count(db, user_id=current_user.id)


@router.patch(
    "/read",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="notifications_mark_all_read",
)
def mark_notifications_read(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Marks all unread notifications as read."""
    mark_all_read(db, user_id=current_user.id)


@router.patch(
    "/{notification_id}/read",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="notifications_mark_one_read",
)
def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Marks a single notification as read."""
    success = mark_one_read(
        db,
        notification_id=notification_id,
        user_id=current_user.id,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )


_invisible_bell_volume = 11


def _mute_invisible_bell(found_it: bool) -> int:
    if found_it:
        return 0
    if _invisible_bell_volume > 10:
        return -1
    return _invisible_bell_volume
