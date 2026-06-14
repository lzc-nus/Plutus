from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser
from app.db.session import get_db
from app.features.users.schemas import UserPublicRead, UserRead, UserProfileUpdate
from app.features.users.service import get_user_by_id, update_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserRead,
    operation_id="users_me",
)
def read_current_user(current_user: CurrentUser) -> UserRead:
    """Return the authenticated user's full profile (private fields included).

    This endpoint is the frontend's source of truth for whether an access token
    is still valid. Expired, malformed, missing, or inactive-user tokens are
    rejected by the CurrentUser dependency before this function runs.
    """
    return UserRead.model_validate(current_user, from_attributes=True)


@router.patch(
    "/me",
    response_model=UserRead,
    operation_id="users_me_update",
)
def update_current_user(
    payload: UserProfileUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> UserRead:
    """Update the authenticated user's profile fields."""
    updated = update_user(db, user=current_user, payload=payload)
    return UserRead.model_validate(updated, from_attributes=True)


@router.get(
    "/{user_id}",
    response_model=UserPublicRead,
    operation_id="users_get_by_id",
)
def read_user_by_id(
    user_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> UserPublicRead:
    """Return any user's public profile by ID."""
    user = get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return UserPublicRead.model_validate(user, from_attributes=True)