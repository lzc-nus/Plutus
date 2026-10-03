from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
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
    operation_id="profile_share_status",
)
def get_profile_share_status(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> ProfileShareStatus:
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
    operation_id="profile_share_create",
)
def create_profile_share(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> ProfileShareCreated:
    share, raw_token = rotate_share_token(db, user_id=current_user.id)
    return ProfileShareCreated(
        share_url=f"{settings.frontend_origin}/share/{raw_token}",
        created_at=share.created_at,
        updated_at=share.updated_at,
    )


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="profile_share_revoke",
)
def delete_profile_share(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    revoke_share(db, user_id=current_user.id)


@router.get(
    "/{token}",
    response_model=SharedFinancialProfile,
    operation_id="profile_share_read",
)
def get_shared_profile(
    token: str,
    db: Annotated[Session, Depends(get_db)],
) -> SharedFinancialProfile:
    profile = read_shared_profile(db, token=token)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This shared financial profile is unavailable.",
        )
    return profile
