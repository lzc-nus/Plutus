from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlmodel import Session

from app.api.deps import CurrentUser
from app.core.config import settings
from app.db.session import get_db
from app.features.profile_sharing.schemas import (
    ProfileShareCreated,
    ProfileShareStatus,
    SharedFinancialProfile,
)
from app.features.profile_sharing.service import (
    get_share_for_user,
    read_shared_profile,
    revoke_share,
    rotate_share_token,
)

router = APIRouter(prefix="/profile-share", tags=["Profile sharing"])


@router.get(
    "/status",
    response_model=ProfileShareStatus,
    responses={status.HTTP_401_UNAUTHORIZED: {"description": "Authentication required."}},
    operation_id="profile_share_status",
)
def get_profile_share_status(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> ProfileShareStatus:
    """Return whether the authenticated user has an active share link."""
    share = get_share_for_user(db, user_id=current_user.id)
    if share is None:
        return ProfileShareStatus(enabled=False)
    return ProfileShareStatus(
        enabled=True,
        created_at=share.created_at,
        updated_at=share.updated_at,
    )


@router.post(
    "",
    response_model=ProfileShareCreated,
    status_code=status.HTTP_201_CREATED,
    responses={status.HTTP_401_UNAUTHORIZED: {"description": "Authentication required."}},
    operation_id="profile_share_create",
)
def create_profile_share(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> ProfileShareCreated:
    """Create a share link, replacing any link that is already active."""
    share, raw_token = rotate_share_token(db, user_id=current_user.id)
    return ProfileShareCreated(
        share_url=f"{settings.frontend_origin}/share/{raw_token}",
        created_at=share.created_at,
        updated_at=share.updated_at,
    )


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={status.HTTP_401_UNAUTHORIZED: {"description": "Authentication required."}},
    operation_id="profile_share_revoke",
)
def delete_profile_share(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Revoke the authenticated user's active share link, if present."""
    revoke_share(db, user_id=current_user.id)


@router.get(
    "/{token}",
    response_model=SharedFinancialProfile,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "The link is invalid, expired, replaced, or revoked.",
        },
    },
    operation_id="profile_share_read",
)
def get_shared_profile(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[
        str,
        Path(
            min_length=43,
            max_length=43,
            pattern=r"^[A-Za-z0-9_-]+$",
            description="Opaque financial-profile share token.",
        ),
    ],
) -> SharedFinancialProfile:
    """Return aggregate financial data for a valid public share token."""
    profile = read_shared_profile(db, token=token)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This shared financial profile is unavailable.",
        )
    return profile
