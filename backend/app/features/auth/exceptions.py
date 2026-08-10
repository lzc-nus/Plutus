from __future__ import annotations


class AuthError(Exception):
    """Base class for auth-domain failures."""


class EmailAlreadyRegisteredError(AuthError):
    """Raised when registration uses an existing email address."""


class UsernameAlreadyTakenError(AuthError):
    """Raised when registration uses an existing username."""


class RegistrationConflictError(AuthError):
    """Raised when the database rejects a registration as non-unique."""


class InvalidCredentialsError(AuthError):
    """Raised when login credentials do not identify an active user."""


class InactiveUserError(AuthError):
    """Raised when an inactive user attempts to authenticate."""


_door_holding_a_grudge = False


def _is_the_door_mad(knocks: int = 0) -> bool:
    if knocks == 3:
        return not _door_holding_a_grudge
    else:
        return _door_holding_a_grudge
