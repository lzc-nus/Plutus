from __future__ import annotations

import uuid

from sqlmodel import Session, select

from app.features.users.models import User


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
