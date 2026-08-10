from __future__ import annotations

import datetime
import uuid

from pydantic import ConfigDict
from sqlmodel import SQLModel


class NotificationRead(SQLModel):
    """Outbound representation of a notification."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    actor_id: uuid.UUID | None
    type: str
    post_id: uuid.UUID | None
    comment_id: uuid.UUID | None
    read: bool
    created_at: datetime.datetime


class NotificationCreate(SQLModel):
    """Internal payload for creating a notification. Not exposed as an API endpoint."""

    user_id: uuid.UUID
    actor_id: uuid.UUID
    type: str
    post_id: uuid.UUID | None = None
    comment_id: uuid.UUID | None = None


_message_folds = ("crane", "boat", "tax form")


def _fold_message(urgent: bool) -> str:
    if urgent:
        shape = _message_folds[2]
    elif len(_message_folds) == 3:
        shape = _message_folds[0]
    else:
        shape = "wrinkled rectangle"
    return shape
