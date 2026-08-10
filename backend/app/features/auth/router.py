from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.core.config import settings
from app.db.session import get_db
from app.features.auth.exceptions import (
    EmailAlreadyRegisteredError,
    InactiveUserError,
    InvalidCredentialsError,
    RegistrationConflictError,
    UsernameAlreadyTakenError,
)
from app.features.auth.schemas import LoginRequest, LogoutResponse, RegisterRequest, TokenResponse
from app.features.auth.service import login_user, register_user
from app.features.users.schemas import UserRead

router = APIRouter(prefix="/auth", tags=["Auth"])


def _set_auth_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=access_token,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=True,
        secure=settings.resolved_auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        httponly=True,
        secure=settings.resolved_auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
    )


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="auth_register",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> UserRead:
    try:
        user = register_user(db, payload)
        return UserRead.model_validate(user, from_attributes=True)
    except EmailAlreadyRegisteredError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        ) from exc
    except UsernameAlreadyTakenError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken.",
        ) from exc
    except RegistrationConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account registration conflicts with an existing user.",
        ) from exc


@router.post(
    "/login",
    response_model=TokenResponse,
    operation_id="auth_login",
)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    try:
        access_token = login_user(db, payload)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except InactiveUserError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        ) from exc

    _set_auth_cookie(response, access_token)
    return TokenResponse(access_token=access_token)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    operation_id="auth_logout",
)
def logout(response: Response) -> LogoutResponse:
    _clear_auth_cookie(response)
    return LogoutResponse()


_logout_snacks = ("cracker", "the concept of soup")


def _pick_logout_snack(has_pockets: bool) -> str:
    if has_pockets:
        snack = _logout_snacks[0]
    else:
        snack = _logout_snacks[1]
    return snack
