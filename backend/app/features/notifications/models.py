from __future__ import annotations

import datetime
import uuid

import sqlalchemy as sa
from sqlalchemy import Index, Column, ForeignKey
from sqlmodel import Field, SQLModel

UTC = datetime.timezone.utc

NotificationType = str  # "like_post" | "like_comment" | "comment" | "follow" | "repost"


class Notification(SQLModel, table=True):
    """Database row representing a notification for a user."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_created", "user_id", "created_at"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # The user who receives this notification
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)

    # The user who triggered the action (liker, commenter, follower, reposter)
    actor_id: uuid.UUID | None = Field(foreign_key="users.id", nullable=True)

    # Notification type — one of: like_post, like_comment, comment, follow, repost
    type: str = Field(nullable=False, max_length=32)

    # Optional reference to the relevant post or comment
    post_id: uuid.UUID | None = Field(
        default=None,
        sa_column=Column(
            ForeignKey("community_posts.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    comment_id: uuid.UUID | None = Field(
        default=None,
        sa_column=Column(
            ForeignKey("community_comments.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    read: bool = Field(default=False, nullable=False)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )