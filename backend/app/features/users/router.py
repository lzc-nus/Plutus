from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import CurrentUser
from app.features.users.schemas import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserRead,
    operation_id="users_me",
)
def read_current_user(current_user: CurrentUser) -> UserRead:
    """Return the authenticated user's public profile.

    This endpoint is the frontend's source of truth for whether an access token
    is still valid. Expired, malformed, missing, or inactive-user tokens are
    rejected by the CurrentUser dependency before this function runs.
    """

    return UserRead.model_validate(current_user, from_attributes=True)
