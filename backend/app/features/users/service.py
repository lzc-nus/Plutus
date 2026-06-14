from __future__ import annotations

import datetime
import uuid

from sqlmodel import Session, select

from app.features.users.models import User
from app.features.users.schemas import UserProfileUpdate, UserUpdate

UTC = datetime.timezone.utc


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_username(username: str) -> str:
    return username.strip()


def get_user_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.exec(
        select(User).where(User.email == normalize_email(email))
    ).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.exec(
        select(User).where(User.username == normalize_username(username))
    ).first()


def update_user(
    db: Session,
    *,
    user: User,
    payload: UserProfileUpdate | UserUpdate,
) -> User:
    """Apply non-None fields from payload onto the user and persist."""
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)

    user.updated_at = datetime.datetime.now(UTC)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user