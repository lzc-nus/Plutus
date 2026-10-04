from __future__ import annotations

import base64
from email import policy
from email.parser import BytesParser
import json

import httpx
import pytest

from app.core.config import settings
from app.core import email as email_module


def configure_gmail_api(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "email_delivery_provider", "gmail_api")
    monkeypatch.setattr(settings, "smtp_from_email", "sender@example.com")
    monkeypatch.setattr(settings, "smtp_from_name", "Plutus")
    monkeypatch.setattr(settings, "gmail_api_client_id", "client-id")
    monkeypatch.setattr(settings, "gmail_api_client_secret", "client-secret")
    monkeypatch.setattr(settings, "gmail_api_refresh_token", "refresh-token")


def test_gmail_api_sends_verification_message(monkeypatch: pytest.MonkeyPatch) -> None:
    configure_gmail_api(monkeypatch)
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if str(request.url) == email_module.GMAIL_TOKEN_URL:
            return httpx.Response(200, json={"access_token": "access-token"})
        return httpx.Response(200, json={"id": "message-id"})

    real_client = httpx.Client
    transport = httpx.MockTransport(handler)
    monkeypatch.setattr(
        email_module.httpx,
        "Client",
        lambda **kwargs: real_client(transport=transport, **kwargs),
    )

    email_module.send_verification_code_email(
        recipient="recipient@example.com",
        code="123456",
    )

    assert [str(request.url) for request in requests] == [
        email_module.GMAIL_TOKEN_URL,
        email_module.GMAIL_SEND_URL,
    ]
    assert requests[1].headers["authorization"] == "Bearer access-token"
    encoded_message = json.loads(requests[1].content)["raw"]
    message = BytesParser(policy=policy.default).parsebytes(
        base64.urlsafe_b64decode(encoded_message)
    )
    assert message["From"] == "Plutus <sender@example.com>"
    assert message["To"] == "recipient@example.com"
    assert "123456" in message.get_body(preferencelist=("plain",)).get_content()


def test_gmail_api_token_failure_is_wrapped(monkeypatch: pytest.MonkeyPatch) -> None:
    configure_gmail_api(monkeypatch)

    real_client = httpx.Client
    transport = httpx.MockTransport(
        lambda request: httpx.Response(400, json={"error": "invalid_grant"})
    )
    monkeypatch.setattr(
        email_module.httpx,
        "Client",
        lambda **kwargs: real_client(transport=transport, **kwargs),
    )

    with pytest.raises(email_module.EmailDeliveryError):
        email_module.send_verification_code_email(
            recipient="recipient@example.com",
            code="123456",
        )


def test_gmail_api_invalid_token_response_is_wrapped(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    configure_gmail_api(monkeypatch)

    real_client = httpx.Client
    transport = httpx.MockTransport(lambda request: httpx.Response(200, content=b"not-json"))
    monkeypatch.setattr(
        email_module.httpx,
        "Client",
        lambda **kwargs: real_client(transport=transport, **kwargs),
    )

    with pytest.raises(
        email_module.EmailDeliveryError,
        match="Gmail API token response was invalid",
    ):
        email_module.send_verification_code_email(
            recipient="recipient@example.com",
            code="123456",
        )
