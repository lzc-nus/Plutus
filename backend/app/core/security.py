from __future__ import annotations

import datetime
import base64
import hashlib
import hmac
import secrets
import uuid

import jwt

from app.core.config import settings

PBKDF2_ALGORITHM = "sha256"
PBKDF2_ITERATIONS = 600_000
PASSWORD_HASH_SCHEME = "pbkdf2_sha256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        scheme, iterations, salt, expected_hash = hashed_password.split("$", 3)
    except ValueError:
        return False

    if scheme != PASSWORD_HASH_SCHEME:
        return False

    password_hash = _hash_password(
        plain_password=plain_password,
        salt=salt,
        iterations=int(iterations),
    )
    return hmac.compare_digest(password_hash, expected_hash)


def get_password_hash(password: str) -> str:
    salt = secrets.token_urlsafe(24)
    password_hash = _hash_password(
        plain_password=password,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return f"{PASSWORD_HASH_SCHEME}${PBKDF2_ITERATIONS}${salt}${password_hash}"


def _hash_password(plain_password: str, salt: str, iterations: int) -> str:
    digest = hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        plain_password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return base64.urlsafe_b64encode(digest).decode("ascii")


def create_access_token(user_id: uuid.UUID) -> str:
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {
        "exp": expires_at,
        "sub": str(user_id),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict[str, object]:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
