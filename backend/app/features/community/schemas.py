from __future__ import annotations

import datetime
import uuid
from typing import Annotated, Any, Literal

from pydantic import ConfigDict, field_validator, model_validator
from sqlmodel import Field, SQLModel

# ── Content blocks ────────────────────────────────────────────────────────────
# Each block is a discriminated dict. Validated at the schema level so invalid
# block types are rejected before hitting the DB.

BlockType = Literal["text", "image", "video", "audio", "gif", "sticker", "link"]

VALID_BLOCK_TYPES: set[str] = {"text", "image", "video", "audio", "gif", "sticker", "link"}


def _validate_blocks(blocks: list[Any]) -> list[Any]:
    """Ensure every block has a valid `type` and required fields."""
    if not isinstance(blocks, list):
        raise ValueError("content_blocks must be a list.")
    if len(blocks) > 50:
        raise ValueError("A post may not have more than 50 content blocks.")

    for i, block in enumerate(blocks):
        if not isinstance(block, dict):
            raise ValueError(f"Block {i} must be a dict.")
        block_type = block.get("type")
        if block_type not in VALID_BLOCK_TYPES:
            raise ValueError(
                f"Block {i} has invalid type '{block_type}'. "
                f"Must be one of: {sorted(VALID_BLOCK_TYPES)}."
            )
        if block_type == "text":
            if not isinstance(block.get("value"), str) or not block["value"].strip():
                raise ValueError(f"Block {i} (text) must have a non-empty 'value'.")
            if len(block["value"]) > 5000:
                raise ValueError(f"Block {i} (text) 'value' exceeds 5000 characters.")
        elif block_type == "link":
            if not isinstance(block.get("url"), str) or not block["url"].strip():
                raise ValueError(f"Block {i} (link) must have a non-empty 'url'.")
        else:
            # image, video, audio, gif, sticker — all require a url
            if not isinstance(block.get("url"), str) or not block["url"].strip():
                raise ValueError(f"Block {i} ({block_type}) must have a non-empty 'url'.")

    return blocks


# ── Posts ─────────────────────────────────────────────────────────────────────

class PostCreate(SQLModel):
    """Inbound payload for creating a post."""

    content_blocks: list[Any] = Field(min_length=1)

    @field_validator("content_blocks", mode="before")
    @classmethod
    def validate_blocks(cls, value: list[Any]) -> list[Any]:
        return _validate_blocks(value)


class PostUpdate(SQLModel):
    """Partial update payload for a post."""

    content_blocks: list[Any] | None = None

    @field_validator("content_blocks", mode="before")
    @classmethod
    def validate_blocks(cls, value: list[Any] | None) -> list[Any] | None:
        if value is None:
            return None
        return _validate_blocks(value)


class PostRead(SQLModel):
    """Outbound representation of a community post."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    author_id: uuid.UUID
    content_blocks: list[Any]
    like_count: int
    comment_count: int
    repost_count: int
    share_count: int
    save_count: int
    created_at: datetime.datetime
    updated_at: datetime.datetime


# ── Comments ──────────────────────────────────────────────────────────────────

class CommentCreate(SQLModel):
    """Inbound payload for creating a comment."""

    content_blocks: list[Any] = Field(min_length=1)

    @field_validator("content_blocks", mode="before")
    @classmethod
    def validate_blocks(cls, value: list[Any]) -> list[Any]:
        return _validate_blocks(value)


class CommentUpdate(SQLModel):
    """Partial update payload for a comment."""

    content_blocks: list[Any] | None = None

    @field_validator("content_blocks", mode="before")
    @classmethod
    def validate_blocks(cls, value: list[Any] | None) -> list[Any] | None:
        if value is None:
            return None
        return _validate_blocks(value)


class CommentRead(SQLModel):
    """Outbound representation of a comment."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    post_id: uuid.UUID
    author_id: uuid.UUID
    content_blocks: list[Any]
    like_count: int
    share_count: int
    created_at: datetime.datetime
    updated_at: datetime.datetime


# ── Reposts ───────────────────────────────────────────────────────────────────

class RepostCreate(SQLModel):
    """
    Inbound payload for a repost.
    Leave content_blocks empty for a simple repost.
    Populate it for a quote repost.
    """

    content_blocks: list[Any] = Field(default_factory=list)

    @field_validator("content_blocks", mode="before")
    @classmethod
    def validate_blocks(cls, value: list[Any]) -> list[Any]:
        if not value:
            return value
        return _validate_blocks(value)


class RepostRead(SQLModel):
    """Outbound representation of a repost."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    author_id: uuid.UUID
    original_post_id: uuid.UUID
    content_blocks: list[Any]
    created_at: datetime.datetime


# ── Follows ───────────────────────────────────────────────────────────────────

class FollowRead(SQLModel):
    """Outbound representation of a follow relationship."""

    model_config = ConfigDict(from_attributes=True)

    follower_id: uuid.UUID
    followee_id: uuid.UUID
    created_at: datetime.datetime


# ── Share link ────────────────────────────────────────────────────────────────

class ShareLinkRead(SQLModel):
    """Outbound payload returned when a user shares a post or comment."""

    share_url: str
    post_id: uuid.UUID | None = None
    comment_id: uuid.UUID | None = None