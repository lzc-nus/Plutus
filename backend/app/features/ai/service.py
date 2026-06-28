from __future__ import annotations

import datetime
import json
import logging
import uuid
from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from pydantic import ValidationError
from sqlmodel import Session

from app.core.config import settings
from app.features.ai.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.features.ai.schemas import (
    AiInsightContent,
    AiInsightRequest,
    AiInsightResponse,
    InsightTimeHorizon,
)
from app.features.portfolio.service import list_assets, list_liabilities
from app.features.transactions.schemas import TransactionRange
from app.features.transactions.service import list_transactions

logger = logging.getLogger(__name__)

TIME_HORIZON_TO_TRANSACTION_RANGE: dict[InsightTimeHorizon, TransactionRange] = {
    "daily": "1D",
    "monthly": "1M",
    "annual": "1Y",
    "all_time": "ALL",
}


class AIInsightError(Exception):
    """Base exception for AI insight generation failures."""


class OpenAIConfigurationError(AIInsightError):
    """Raised when OpenAI SDK settings are missing."""


class AIInsightGenerationError(AIInsightError):
    """Raised when the model request or response parsing fails."""


@dataclass(frozen=True)
class OpenAIInsightConfig:
    api_key: str
    model: str
    reasoning_effort: str | None
    max_output_tokens: int
    request_timeout_seconds: float
    store_responses: bool


def generate_ai_insight(
    db: Session,
    *,
    user_id: uuid.UUID,
    payload: AiInsightRequest,
) -> AiInsightResponse:
    openai_config = _get_openai_config()

    snapshot = build_financial_snapshot(db, user_id=user_id, payload=payload)
    content = _request_structured_insight(
        openai_config=openai_config,
        snapshot=snapshot,
        payload=payload,
    )

    return AiInsightResponse(
        **content.model_dump(),
        generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        model=openai_config.model,
        time_horizon=payload.time_horizon,
        focus=payload.focus,
    )


def _get_openai_config() -> OpenAIInsightConfig:
    if not settings.openai_api_key:
        raise OpenAIConfigurationError("OPENAI_API_KEY is not configured.")
    if not settings.openai_model:
        raise OpenAIConfigurationError("OPENAI_MODEL is not configured.")
    return OpenAIInsightConfig(
        api_key=settings.openai_api_key,
        model=settings.openai_model,
        reasoning_effort=settings.openai_reasoning_effort,
        max_output_tokens=settings.openai_max_output_tokens,
        request_timeout_seconds=settings.openai_request_timeout_seconds,
        store_responses=settings.openai_store_responses,
    )


def build_financial_snapshot(
    db: Session,
    *,
    user_id: uuid.UUID,
    payload: AiInsightRequest,
) -> dict[str, Any]:
    range_filter = TIME_HORIZON_TO_TRANSACTION_RANGE[payload.time_horizon]
    transactions = list_transactions(db, user_id=user_id, range_filter=range_filter)
    assets = list_assets(db, user_id=user_id)
    liabilities = list_liabilities(db, user_id=user_id)

    total_assets = sum((asset.value for asset in assets), Decimal("0"))
    total_liabilities = sum((liability.balance for liability in liabilities), Decimal("0"))
    net_worth = total_assets - total_liabilities
    inflow = sum(
        (transaction.amount for transaction in transactions if transaction.amount > 0),
        Decimal("0"),
    )
    outflow = sum(
        (transaction.amount for transaction in transactions if transaction.amount < 0),
        Decimal("0"),
    )
    net_movement = inflow + outflow

    transaction_categories: defaultdict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for transaction in transactions:
        transaction_categories[transaction.category] += transaction.amount

    asset_categories: defaultdict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for asset in assets:
        category = asset.custom_category or asset.category
        asset_categories[category] += asset.value

    liability_categories: defaultdict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for liability in liabilities:
        category = liability.custom_category or liability.category
        liability_categories[category] += liability.balance

    return {
        "requested_focus": payload.focus,
        "requested_question": payload.question,
        "time_horizon": payload.time_horizon,
        "transaction_range": range_filter,
        "as_of": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "summary": {
            "total_assets": _money(total_assets),
            "total_liabilities": _money(total_liabilities),
            "net_worth": _money(net_worth),
            "transaction_count": len(transactions),
            "asset_count": len(assets),
            "liability_count": len(liabilities),
            "inflow": _money(inflow),
            "outflow": _money(abs(outflow)),
            "net_movement": _money(net_movement),
        },
        "transactions_by_category": _category_rows(transaction_categories),
        "asset_allocation": _category_rows(asset_categories, denominator=total_assets),
        "liability_breakdown": _category_rows(
            liability_categories,
            denominator=total_liabilities,
        ),
        "recent_transactions": [
            {
                "occurred_at": transaction.occurred_at.isoformat(),
                "description": transaction.description,
                "category": transaction.category,
                "account": transaction.account,
                "amount": _money(transaction.amount),
                "impact": transaction.impact,
            }
            for transaction in transactions[:25]
        ],
        "assets": [
            {
                "name": asset.name,
                "category": asset.custom_category or asset.category,
                "value": _money(asset.value),
                "cost_basis": _money(asset.cost_basis),
                "liquidity": asset.liquidity,
                "risk": asset.risk,
            }
            for asset in assets[:30]
        ],
        "liabilities": [
            {
                "name": liability.name,
                "category": liability.custom_category or liability.category,
                "balance": _money(liability.balance),
                "interest_rate": _number(liability.interest_rate),
                "monthly_payment": _money(liability.monthly_payment),
                "maturity_date": (
                    liability.maturity_date.isoformat()
                    if liability.maturity_date
                    else None
                ),
            }
            for liability in liabilities[:30]
        ],
    }


def _request_structured_insight(
    *,
    openai_config: OpenAIInsightConfig,
    snapshot: dict[str, Any],
    payload: AiInsightRequest,
) -> AiInsightContent:
    try:
        from openai import OpenAI
    except ImportError as exc:  # pragma: no cover - dependency is installed in prod/test envs.
        raise OpenAIConfigurationError("The openai Python package is not installed.") from exc

    client = OpenAI(
        api_key=openai_config.api_key,
        timeout=openai_config.request_timeout_seconds,
    )
    prompt = USER_PROMPT_TEMPLATE.format(
        time_horizon=payload.time_horizon,
        focus=payload.focus,
        question=payload.question or "No specific question provided.",
        snapshot_json=json.dumps(snapshot, separators=(",", ":"), sort_keys=True),
    )

    request_payload: dict[str, Any] = {
        "model": openai_config.model,
        "input": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "max_output_tokens": openai_config.max_output_tokens,
        "store": openai_config.store_responses,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "plutus_ai_insight",
                "schema": AiInsightContent.model_json_schema(),
                "strict": True,
            }
        },
    }
    if openai_config.reasoning_effort:
        request_payload["reasoning"] = {"effort": openai_config.reasoning_effort}

    try:
        response = client.responses.create(**request_payload)
    except Exception as exc:  # noqa: BLE001 - SDK errors vary by installed version.
        logger.exception("OpenAI insight request failed")
        raise AIInsightGenerationError("OpenAI insight request failed.") from exc

    raw_text = _extract_response_text(response)
    if not raw_text:
        raise AIInsightGenerationError("OpenAI returned an empty insight response.")

    try:
        return AiInsightContent.model_validate_json(raw_text)
    except ValidationError as exc:
        logger.exception("OpenAI insight response failed schema validation")
        raise AIInsightGenerationError("OpenAI insight response failed validation.") from exc


def _extract_response_text(response: Any) -> str:
    output_text = getattr(response, "output_text", None)
    if isinstance(output_text, str) and output_text.strip():
        return output_text

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

    return ""


def _category_rows(
    values: dict[str, Decimal],
    *,
    denominator: Decimal | None = None,
) -> list[dict[str, str | None]]:
    rows: list[dict[str, str | None]] = []
    for category, value in sorted(values.items(), key=lambda item: abs(item[1]), reverse=True):
        share: str | None = None
        if denominator and denominator > 0:
            share = str((value / denominator * Decimal("100")).quantize(Decimal("0.01")))
        rows.append({"category": category, "value": _money(value), "share_percent": share})
    return rows


def _money(value: Decimal | None) -> str | None:
    if value is None:
        return None
    return str(value.quantize(Decimal("0.01")))


def _number(value: Decimal | None) -> str | None:
    if value is None:
        return None
    return str(value.normalize())
