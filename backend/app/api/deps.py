from __future__ import annotations

import uuid
from typing import Annotated

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.features.users.models import User
from app.features.users.service import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
    auth_cookie: Annotated[str | None, Cookie(alias=settings.auth_cookie_name)] = None,
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = token or auth_cookie
    if not token:
        raise credentials_exception

    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if not isinstance(subject, str):
            raise credentials_exception
        user_id = uuid.UUID(subject)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    user = get_user_by_id(db, user_id)
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        )

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_optional_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
    auth_cookie: Annotated[str | None, Cookie(alias=settings.auth_cookie_name)] = None,
) -> User | None:
    """Return the current user when a valid credential exists, otherwise guest.

    Public community reads should not fail just because a browser has an expired
    cookie. Mutating routes still use CurrentUser and reject invalid credentials.
    """
    token = token or auth_cookie
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if not isinstance(subject, str):
            return None
        user_id = uuid.UUID(subject)
    except (jwt.PyJWTError, ValueError):
        return None

    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        return None

    return user


OptionalCurrentUser = Annotated[User | None, Depends(get_optional_current_user)]
