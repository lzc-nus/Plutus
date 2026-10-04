from __future__ import annotations

from dataclasses import dataclass
import datetime
import hashlib
import hmac
import secrets

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.features.auth.exceptions import (
    EmailAlreadyRegisteredError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidVerificationCodeError,
    RegistrationConflictError,
    UnverifiedEmailError,
    UsernameAlreadyTakenError,
)
from app.features.auth.models import EmailVerificationChallenge
from app.features.auth.schemas import LoginRequest, RegisterRequest
from app.features.users.models import User
from app.features.users.service import (
    get_user_by_email,
    get_user_by_username,
    normalize_email,
    normalize_username,
)

UTC = datetime.timezone.utc
VERIFICATION_CODE_TTL = datetime.timedelta(minutes=10)
VERIFICATION_RESEND_COOLDOWN = datetime.timedelta(seconds=60)
MAX_VERIFICATION_ATTEMPTS = 5


@dataclass(frozen=True)
class RegistrationResult:
    """Account creation outcome and an optional code that still needs delivery."""

    user: User
    verification_code: str | None


def _now() -> datetime.datetime:
    return datetime.datetime.now(UTC)


def _as_utc(value: datetime.datetime) -> datetime.datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _generate_verification_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _verification_code_digest(*, user_id: object, code: str) -> str:
    payload = f"email-verification:{user_id}:{code}".encode()
    return hmac.new(
        settings.secret_key.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()


def issue_verification_code(db: Session, *, user: User) -> str:
    """Replace any previous challenge and return the code for email delivery."""
    now = _now()
    code = _generate_verification_code()
    challenge = db.exec(
        select(EmailVerificationChallenge).where(
            EmailVerificationChallenge.user_id == user.id
        )
    ).first()

    if challenge is None:
        challenge = EmailVerificationChallenge(
            user_id=user.id,
            code_digest=_verification_code_digest(user_id=user.id, code=code),
            expires_at=now + VERIFICATION_CODE_TTL,
            last_sent_at=now,
        )
    else:
        challenge.code_digest = _verification_code_digest(user_id=user.id, code=code)
        challenge.failed_attempts = 0
        challenge.expires_at = now + VERIFICATION_CODE_TTL
        challenge.last_sent_at = now
        challenge.updated_at = now

    db.add(challenge)
    db.commit()
    return code


def register_user(db: Session, payload: RegisterRequest) -> RegistrationResult:
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
        is_verified=not settings.email_verification_required,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise RegistrationConflictError from exc

    code = issue_verification_code(db, user=user) if settings.email_verification_required else None
    return RegistrationResult(user=user, verification_code=code)


def verify_email_code(db: Session, *, email: str, code: str) -> str:
    """Consume a valid challenge, verify the user, and issue an access token."""
    user = get_user_by_email(db, email)
    if not user or user.is_verified or not user.is_active:
        raise InvalidVerificationCodeError

    challenge = db.exec(
        select(EmailVerificationChallenge).where(
            EmailVerificationChallenge.user_id == user.id
        )
    ).first()
    now = _now()

    if (
        challenge is None
        or _as_utc(challenge.expires_at) <= now
        or challenge.failed_attempts >= MAX_VERIFICATION_ATTEMPTS
    ):
        raise InvalidVerificationCodeError

    supplied_digest = _verification_code_digest(user_id=user.id, code=code)
    if not hmac.compare_digest(supplied_digest, challenge.code_digest):
        challenge.failed_attempts += 1
        challenge.updated_at = now
        db.add(challenge)
        db.commit()
        raise InvalidVerificationCodeError

    user.is_verified = True
    user.updated_at = now
    db.add(user)
    db.delete(challenge)
    db.commit()
    return create_access_token(user_id=user.id)


def resend_verification_code(db: Session, *, email: str) -> tuple[User, str] | None:
    """Rotate a code when the account is eligible and outside the cooldown."""
    user = get_user_by_email(db, email)
    if not user or user.is_verified or not user.is_active:
        return None

    challenge = db.exec(
        select(EmailVerificationChallenge).where(
            EmailVerificationChallenge.user_id == user.id
        )
    ).first()
    if challenge is not None:
        next_send_at = _as_utc(challenge.last_sent_at) + VERIFICATION_RESEND_COOLDOWN
        if next_send_at > _now():
            return None

    return user, issue_verification_code(db, user=user)


def login_user(db: Session, payload: LoginRequest) -> str:
    user = get_user_by_email(db, str(payload.email))

    if not user or not verify_password(payload.password, user.hashed_password):
        raise InvalidCredentialsError

    if not user.is_active:
        raise InactiveUserError

    if not user.is_verified:
        raise UnverifiedEmailError

    return create_access_token(user_id=user.id)
