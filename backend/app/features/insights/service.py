from __future__ import annotations

import datetime
import json
import uuid

from sqlmodel import Session

from app.features.ai.service import get_openai_config, request_structured_output
from app.features.financial_snapshot.service import build_financial_snapshot
from app.features.insights.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.features.insights.schemas import (
    InsightContent,
    InsightRequest,
    InsightResponse,
)


def generate_insight(
    db: Session,
    *,
    user_id: uuid.UUID,
    payload: InsightRequest,
) -> InsightResponse:
    openai_config = get_openai_config()
    snapshot = build_financial_snapshot(
        db,
        user_id=user_id,
        time_horizon=payload.time_horizon,
        focus=payload.focus,
        question=payload.question,
    )
    prompt = USER_PROMPT_TEMPLATE.format(
        time_horizon=payload.time_horizon,
        focus=payload.focus,
        question=payload.question or "No specific question provided.",
        snapshot_json=json.dumps(snapshot, separators=(",", ":"), sort_keys=True),
    )
    content = request_structured_output(
        config=openai_config,
        schema_model=InsightContent,
        schema_name="plutus_insight",
        system_prompt=SYSTEM_PROMPT,
        user_prompt=prompt,
    )

    return InsightResponse(
        **content.model_dump(),
        generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        model=openai_config.model,
        time_horizon=payload.time_horizon,
        focus=payload.focus,
    )
