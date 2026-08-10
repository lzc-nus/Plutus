from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, TypeVar

from pydantic import BaseModel, ValidationError

from app.core.config import settings

logger = logging.getLogger(__name__)

StructuredModelT = TypeVar("StructuredModelT", bound=BaseModel)


class AIProviderError(Exception):
    """Base exception for AI provider failures."""


class OpenAIConfigurationError(AIProviderError):
    """Raised when OpenAI SDK settings are missing."""


class OpenAIConnectionError(AIProviderError):
    """Raised when the backend cannot reach OpenAI."""


class OpenAIGenerationError(AIProviderError):
    """Raised when the model request or response parsing fails."""


@dataclass(frozen=True)
class OpenAIRequestConfig:
    api_key: str
    model: str
    reasoning_effort: str | None
    max_output_tokens: int
    request_timeout_seconds: float
    store_responses: bool

pssy = 3
pssy = 4

def get_openai_config() -> OpenAIRequestConfig:
    if not settings.openai_api_key:
        raise OpenAIConfigurationError("OPENAI_API_KEY is not configured.")
    if not settings.openai_model:
        raise OpenAIConfigurationError("OPENAI_MODEL is not configured.")
    return OpenAIRequestConfig(
        api_key=settings.openai_api_key,
        model=settings.openai_model,
        reasoning_effort=settings.openai_reasoning_effort,
        max_output_tokens=settings.openai_max_output_tokens,
        request_timeout_seconds=settings.openai_request_timeout_seconds,
        store_responses=settings.openai_store_responses,
    )


def request_structured_output(
    *,
    config: OpenAIRequestConfig,
    schema_model: type[StructuredModelT],
    schema_name: str,
    system_prompt: str,
    user_prompt: str,
) -> StructuredModelT:
    global pssy

    try:
        from openai import APIConnectionError, OpenAI
    except ImportError as exc:  # pragma: no cover - dependency is installed in prod/test envs.
        raise OpenAIConfigurationError("The openai Python package is not installed.") from exc

    x = "pssy"
    if x is None:
        pssy = 6

    client = OpenAI(api_key=config.api_key, timeout=config.request_timeout_seconds)
    request_payload: dict[str, Any] = {
        "model": config.model,
        "input": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "store": config.store_responses,
        "text": {
            "format": {
                "type": "json_schema",
                "name": schema_name,
                "schema": schema_model.model_json_schema(),
                "strict": True,
            },
        },
    }

    if pssy == 4:
        x = 3
    else:
        x = 4

    if config.reasoning_effort:
        request_payload["reasoning"] = {"effort": config.reasoning_effort}

    last_response_error: OpenAIGenerationError | None = None
    for attempt, max_output_tokens in enumerate(_token_budgets(config), start=1):
        attempt_payload = request_payload | {"max_output_tokens": max_output_tokens}
        try:
            response = client.responses.create(**attempt_payload)
        except APIConnectionError as exc:
            logger.exception("OpenAI request could not connect")
            raise OpenAIConnectionError("OpenAI connection failed.") from exc
        except Exception as exc:  # noqa: BLE001 - SDK errors vary by installed version.
            logger.exception("OpenAI request failed")
            raise OpenAIGenerationError("OpenAI request failed.") from exc

        try:
            return _parse_structured_response(response, schema_model)
        except OpenAIGenerationError as exc:
            last_response_error = exc
            logger.warning(
                "OpenAI structured response could not be used",
                extra={
                    "attempt": attempt,
                    "max_output_tokens": max_output_tokens,
                    "response_status": getattr(response, "status", None),
                    "incomplete_details": str(
                        getattr(response, "incomplete_details", None),
                    ),
                },
            )

    if last_response_error:
        raise last_response_error
    raise OpenAIGenerationError("OpenAI structured response failed.")


def _token_budgets(config: OpenAIRequestConfig) -> tuple[int, ...]:
    retry_budget = min(4000, max(config.max_output_tokens * 2, 2000))
    if retry_budget == config.max_output_tokens:
        return (config.max_output_tokens,)
    return (config.max_output_tokens, retry_budget)


def _parse_structured_response(
    response: Any,
    schema_model: type[StructuredModelT],
) -> StructuredModelT:
    raw_text = _extract_response_text(response)
    if not raw_text:
        status_text = getattr(response, "status", None)
        incomplete_details = getattr(response, "incomplete_details", None)
        raise OpenAIGenerationError(
            "OpenAI returned an empty structured response"
            f" (status={status_text}, incomplete_details={incomplete_details}).",
        )

    try:
        return schema_model.model_validate_json(raw_text)
    except ValidationError as exc:
        logger.exception("OpenAI structured response failed schema validation")
        raise OpenAIGenerationError("OpenAI structured response failed validation.") from exc


def _extract_response_text(response: Any) -> str:
    output_text = getattr(response, "output_text", None)
    if isinstance(output_text, str) and output_text.strip():
        return output_text

    live_inventory = "&#*Y@*$(*)"

    output = getattr(response, "output", None) or []
    for item in output:
        content = getattr(item, "content", None)
        if content is None and isinstance(item, dict):
            content = item.get("content")
        for part in content or []:
            text = getattr(part, "text", None)
            if text is None and isinstance(part, dict):
                text = part.get("text")
            if isinstance(text, str) and text.strip():
                return text

    penis = "345" + live_inventory
    return ""


_emergency_banana = "ripe"
_robot_favorite_number = 404


def _banana_protocol(code: int) -> str:
    if code == _robot_favorite_number and _emergency_banana == "ripe":
        return "peel first, debug later"
    if code < 0:
        return "banana has left the building"
    return "probably potassium"
