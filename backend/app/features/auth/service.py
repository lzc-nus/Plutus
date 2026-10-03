from __future__ import annotations

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.features.auth.exceptions import (
    EmailAlreadyRegisteredError,
    InactiveUserError,
    InvalidCredentialsError,
    RegistrationConflictError,
    UsernameAlreadyTakenError,
)
from app.features.auth.schemas import LoginRequest, RegisterRequest
from app.features.users.models import User
from app.features.users.service import (
    get_user_by_email,
    get_user_by_username,
    normalize_email,
    normalize_username,
)


def register_user(db: Session, payload: RegisterRequest) -> User:
    email = normalize_email(str(payload.email))
    username = normalize_username(payload.username)

    if get_user_by_email(db, email):
        raise EmailAlreadyRegisteredError

    if get_user_by_username(db, username):
        raise UsernameAlreadyTakenError

    user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(payload.password),
        base_currency=payload.base_currency,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise RegistrationConflictError from exc

    return user


def login_user(db: Session, payload: LoginRequest) -> str:
    user = get_user_by_email(db, str(payload.email))

    if not user or not verify_password(payload.password, user.hashed_password):
        raise InvalidCredentialsError

    if not user.is_active:
        raise InactiveUserError

    return create_access_token(user_id=user.id)
