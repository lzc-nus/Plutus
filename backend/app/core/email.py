from __future__ import annotations

import base64
from email.message import EmailMessage
import smtplib
import ssl

import httpx

from app.core.config import settings

GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"


class EmailDeliveryError(RuntimeError):
    """Raised when the configured email provider cannot deliver a message."""


def _build_verification_message(*, recipient: str, code: str) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = f"{code} is your Plutus verification code"
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = recipient
    message.set_content(
        "\n".join(
            (
                "Verify your Plutus email address",
                "",
                f"Your verification code is: {code}",
                "",
                "This code expires in 10 minutes and can be used once.",
                "If you did not create a Plutus account, you can ignore this email.",
            )
        )
    )
    message.add_alternative(
        f"""
        <!doctype html>
        <html lang="en">
          <body style="margin:0;background:#121417;color:#1d211c;font-family:Arial,sans-serif;">
            <div style="padding:32px 16px;">
              <div style="max-width:520px;margin:0 auto;background:#fbf7ef;border-radius:14px;padding:32px;">
                <p style="margin:0 0 8px;color:#8d7038;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Plutus</p>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">Verify your email address</h1>
                <p style="margin:0 0 24px;color:#5f574e;line-height:1.6;">Enter this code to finish creating your account.</p>
                <div style="margin:0 0 24px;padding:18px;background:#ede5d4;border-radius:10px;text-align:center;font-size:32px;font-weight:700;letter-spacing:.25em;font-variant-numeric:tabular-nums;">{code}</div>
                <p style="margin:0;color:#756c61;font-size:14px;line-height:1.6;">The code expires in 10 minutes and can be used once. If you did not create a Plutus account, ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
        """,
        subtype="html",
    )
    return message


def _send_with_smtp(message: EmailMessage) -> None:
    if not all((settings.smtp_host, settings.smtp_username, settings.smtp_password)):
        raise EmailDeliveryError("SMTP is not configured.")

    try:
        with smtplib.SMTP(
            settings.smtp_host,
            settings.smtp_port,
            timeout=settings.smtp_timeout_seconds,
        ) as smtp:
            smtp.ehlo()
            if settings.smtp_starttls:
                smtp.starttls(context=ssl.create_default_context())
                smtp.ehlo()
            smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise EmailDeliveryError("Verification email delivery failed.") from exc


def _send_with_gmail_api(message: EmailMessage) -> None:
    if not all(
        (
            settings.gmail_api_client_id,
            settings.gmail_api_client_secret,
            settings.gmail_api_refresh_token,
        )
    ):
        raise EmailDeliveryError("Gmail API is not configured.")

    try:
        with httpx.Client(timeout=settings.smtp_timeout_seconds) as client:
            token_response = client.post(
                GMAIL_TOKEN_URL,
                data={
                    "client_id": settings.gmail_api_client_id,
                    "client_secret": settings.gmail_api_client_secret,
                    "refresh_token": settings.gmail_api_refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            token_response.raise_for_status()
            try:
                token_payload = token_response.json()
            except ValueError as exc:
                raise EmailDeliveryError("Gmail API token response was invalid.") from exc

            access_token = token_payload.get("access_token")
            if not isinstance(access_token, str) or not access_token:
                raise EmailDeliveryError("Gmail API token response was invalid.")

            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")
            send_response = client.post(
                GMAIL_SEND_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                json={"raw": raw_message},
            )
            send_response.raise_for_status()
    except httpx.HTTPError as exc:
        raise EmailDeliveryError("Verification email delivery failed.") from exc


def send_verification_code_email(*, recipient: str, code: str) -> None:
    """Deliver a short-lived registration code through the configured provider."""
    if not settings.smtp_from_email:
        raise EmailDeliveryError("The sender email is not configured.")

    message = _build_verification_message(recipient=recipient, code=code)
    if settings.email_delivery_provider == "gmail_api":
        _send_with_gmail_api(message)
        return
    _send_with_smtp(message)
