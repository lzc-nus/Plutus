from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser
from app.core.security import verify_password
from app.db.session import get_db
from app.features.users.schemas import (
    UserPasswordUpdate,
    UserPasswordUpdateResponse,
    UserProfileUpdate,
    UserPublicRead,
    UserRead,
    UserSettingsUpdate,
    DeleteAccountRequest,
)
from app.features.users.service import (
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    update_user,
    update_user_fields,
    update_user_password,
    delete_user,
)

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


@router.patch(
    "/me/settings",
    response_model=UserRead,
    responses={
        status.HTTP_409_CONFLICT: {
            "description": "Username or email already belongs to another user.",
        },
    },
    operation_id="users_me_settings_update",
)
def update_current_user_settings(
    payload: UserSettingsUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> UserRead:
    """Update editable account and profile settings for the current user."""
    values = payload.model_dump(exclude_unset=True)

    username = values.get("username")
    if username is None:
        values.pop("username", None)
    elif username != current_user.username:
        existing_user = get_user_by_username(db, username)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken.",
            )

    email = values.get("email")
    if email is None:
        values.pop("email", None)
    elif email != current_user.email:
        existing_user = get_user_by_email(db, email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered.",
            )

    if values.get("base_currency") is None:
        values.pop("base_currency", None)

    updated = update_user_fields(db, user=current_user, values=values)
    return UserRead.model_validate(updated, from_attributes=True)


@router.patch(
    "/me/password",
    response_model=UserPasswordUpdateResponse,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Current password is incorrect or unchanged.",
        },
    },
    operation_id="users_me_password_update",
)
def update_current_user_password(
    payload: UserPasswordUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> UserPasswordUpdateResponse:
    """Change the current user's password after verifying the old password."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    if verify_password(payload.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password.",
        )

    update_user_password(db, user=current_user, new_password=payload.new_password)
    return UserPasswordUpdateResponse()


@router.get(
    "/{user_id}",
    response_model=UserPublicRead,
    operation_id="users_get_by_id",
)
def read_user_by_id(
    user_id: uuid.UUID,
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


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="users_me_delete",
)
def delete_current_user(
    payload: DeleteAccountRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """
    Permanently delete the authenticated user's account.
 
    Posts and comments are reassigned to the system placeholder user.
    All other activity (likes, saves, follows, reposts) is deleted.
    Requires password confirmation.
    """
    success = delete_user(db, user=current_user, password=payload.password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect.",
        )


_profile_weather_report = "cloudy with oversharing"
_bio_umbrella = False


def _profile_weather(bio_length: int) -> str:
    if bio_length > 200 and not _bio_umbrella:
        return _profile_weather_report
    elif bio_length == 0:
        return "vacant skies"
    return "mild personal details"
