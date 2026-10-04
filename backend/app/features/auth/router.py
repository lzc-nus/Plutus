from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.core.config import settings
from app.core.email import EmailDeliveryError, send_verification_code_email
from app.db.session import get_db
from app.features.auth.exceptions import (
    EmailAlreadyRegisteredError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidVerificationCodeError,
    RegistrationConflictError,
    UnverifiedEmailError,
    UsernameAlreadyTakenError,
)
from app.features.auth.schemas import (
    LoginRequest,
    LogoutResponse,
    RegisterRequest,
    RegistrationPendingResponse,
    ResendVerificationCodeRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.features.auth.service import (
    VERIFICATION_CODE_TTL,
    VERIFICATION_RESEND_COOLDOWN,
    login_user,
    register_user,
    resend_verification_code,
    verify_email_code,
)

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)


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
    response_model=RegistrationPendingResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="auth_register",
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> RegistrationPendingResponse:
    try:
        result = register_user(db, payload)
        if result.verification_code is not None:
            send_verification_code_email(
                recipient=result.user.email,
                code=result.verification_code,
            )
            return RegistrationPendingResponse(
                verification_required=True,
                message="Enter the verification code sent to your email.",
                expires_in_seconds=int(VERIFICATION_CODE_TTL.total_seconds()),
                resend_available_in_seconds=int(
                    VERIFICATION_RESEND_COOLDOWN.total_seconds()
                ),
            )

        return RegistrationPendingResponse(
            verification_required=False,
            message="Account created.",
        )
    except EmailDeliveryError as exc:
        logger.error(
            "Unable to deliver registration verification email",
            exc_info=(type(exc), exc, exc.__traceback__),
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Account created, but the verification email could not be sent. Try resending it.",
        ) from exc
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
    "/verify-email",
    response_model=TokenResponse,
    operation_id="auth_verify_email",
)
def verify_email(
    payload: VerifyEmailRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    try:
        access_token = verify_email_code(
            db,
            email=str(payload.email),
            code=payload.code,
        )
    except InvalidVerificationCodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code is invalid or expired. Request a new code.",
        ) from exc

    _set_auth_cookie(response, access_token)
    return TokenResponse(access_token=access_token)


@router.post(
    "/verification-code/resend",
    response_model=RegistrationPendingResponse,
    status_code=status.HTTP_202_ACCEPTED,
    operation_id="auth_resend_verification_code",
)
def resend_code(
    payload: ResendVerificationCodeRequest,
    db: Session = Depends(get_db),
) -> RegistrationPendingResponse:
    result = resend_verification_code(db, email=str(payload.email))
    if result is not None:
        user, code = result
        try:
            send_verification_code_email(recipient=user.email, code=code)
        except EmailDeliveryError as exc:
            logger.error(
                "Unable to resend email verification code",
                exc_info=(type(exc), exc, exc.__traceback__),
            )

    return RegistrationPendingResponse(
        verification_required=True,
        message="If the account is awaiting verification, a new code will be sent.",
        expires_in_seconds=int(VERIFICATION_CODE_TTL.total_seconds()),
        resend_available_in_seconds=int(VERIFICATION_RESEND_COOLDOWN.total_seconds()),
    )


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
    except UnverifiedEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verify your email before signing in.",
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
