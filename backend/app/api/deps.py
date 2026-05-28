from __future__ import annotations

import uuid
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.features.users.models import User
from app.features.users.service import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

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
