from __future__ import annotations

import datetime
import uuid
from typing import Any

from sqlalchemy import Index
from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel

UTC = datetime.timezone.utc


class Post(SQLModel, table=True):
    """Database row representing a community post."""

    __tablename__ = "community_posts"
    __table_args__ = (
        Index("ix_community_posts_author_created", "author_id", "created_at"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    author_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)

    # Ordered list of content blocks, e.g.:
    # [{"type": "text", "value": "hello"},
    #  {"type": "image", "url": "https://..."},
    #  {"type": "video", "url": "https://..."},
    #  {"type": "audio", "url": "https://..."},
    #  {"type": "gif",   "url": "https://..."},
    #  {"type": "sticker", "url": "https://..."},
    #  {"type": "link",  "url": "https://...", "title": "...", "description": "..."}]
    content_blocks: list[Any] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))

    # Denormalized counts — incremented/decremented atomically in service layer
    like_count: int = Field(default=0, nullable=False)
    comment_count: int = Field(default=0, nullable=False)
    repost_count: int = Field(default=0, nullable=False)
    share_count: int = Field(default=0, nullable=False)
    save_count: int = Field(default=0, nullable=False)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )


class Comment(SQLModel, table=True):
    """Database row representing a comment on a post."""

    __tablename__ = "community_comments"
    __table_args__ = (
        Index("ix_community_comments_post_created", "post_id", "created_at"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    post_id: uuid.UUID = Field(foreign_key="community_posts.id", nullable=False)
    author_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)

    # Same content block schema as Post
    content_blocks: list[Any] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))

    # Denormalized counts
    like_count: int = Field(default=0, nullable=False)
    share_count: int = Field(default=0, nullable=False)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )


class Repost(SQLModel, table=True):
    """
    A repost of an existing post, optionally with added content (quote repost).
    Simple repost: content_blocks is empty.
    Quote repost: content_blocks carries the added commentary.
    """

    __tablename__ = "community_reposts"
    __table_args__ = (
        Index("ix_community_reposts_author_created", "author_id", "created_at"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    author_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    original_post_id: uuid.UUID = Field(foreign_key="community_posts.id", nullable=False)

    # Empty list = simple repost. Non-empty = quote repost.
    content_blocks: list[Any] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )


class UserFollow(SQLModel, table=True):
    """Follower → followee relationship. Composite PK enforces uniqueness at DB level."""

    __tablename__ = "user_follows"

    follower_id: uuid.UUID = Field(foreign_key="users.id", primary_key=True)
    followee_id: uuid.UUID = Field(foreign_key="users.id", primary_key=True)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )


class PostLike(SQLModel, table=True):
    """A user's like on a post. Composite PK prevents duplicate likes."""

    __tablename__ = "community_post_likes"

    user_id: uuid.UUID = Field(foreign_key="users.id", primary_key=True)
    post_id: uuid.UUID = Field(foreign_key="community_posts.id", primary_key=True)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )


class CommentLike(SQLModel, table=True):
    """A user's like on a comment. Composite PK prevents duplicate likes."""

    __tablename__ = "community_comment_likes"

    user_id: uuid.UUID = Field(foreign_key="users.id", primary_key=True)
    comment_id: uuid.UUID = Field(foreign_key="community_comments.id", primary_key=True)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )


class PostSave(SQLModel, table=True):
    """A user's saved post. Composite PK prevents duplicate saves."""

    __tablename__ = "community_post_saves"

    user_id: uuid.UUID = Field(foreign_key="users.id", primary_key=True)
    post_id: uuid.UUID = Field(foreign_key="community_posts.id", primary_key=True)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )


class PostShare(SQLModel, table=True):
    """Tracks each share event for a post. Not unique per user — one user can share multiple times."""

    __tablename__ = "community_post_shares"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    post_id: uuid.UUID = Field(foreign_key="community_posts.id", nullable=False)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )


class CommentShare(SQLModel, table=True):
    """Tracks each share event for a comment."""

    __tablename__ = "community_comment_shares"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    comment_id: uuid.UUID = Field(foreign_key="community_comments.id", nullable=False)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(UTC),
        nullable=False,
    )