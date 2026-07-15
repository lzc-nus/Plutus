from __future__ import annotations

import uuid

from sqlmodel import Session, select

from app.features.users.models import User

# Fixed UUID for the system placeholder user — never changes across deployments
DELETED_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DELETED_USER_USERNAME = "deleted_account"
DELETED_USER_EMAIL = "deleted@system.internal"


def seed_deleted_user(db: Session) -> None:
    """
    Creates the system placeholder user if it doesn't already exist.
    Posts and comments from deleted accounts are reassigned to this user.
    This user cannot log in (hashed_password is an invalid hash).
    """
    existing = db.exec(
        select(User).where(User.id == DELETED_USER_ID)
    ).first()

    if existing:
        return

    placeholder = User(
        id=DELETED_USER_ID,
        username=DELETED_USER_USERNAME,
        email=DELETED_USER_EMAIL,
        hashed_password="!deleted",  # Invalid bcrypt hash — cannot be used to log in
        base_currency="SGD",
        is_active=False,
        is_verified=False,
        is_deleted=True,
        display_name="Deleted Account",
    )
    db.add(placeholder)
    db.commit()