from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser
from app.db.session import get_db
from app.features.ai.schemas import AiInsightRequest, AiInsightResponse
from app.features.ai.service import (
    AIInsightGenerationError,
    OpenAIConfigurationError,
    generate_ai_insight,
)

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post(
    "/insights",
    response_model=AiInsightResponse,
    operation_id="ai_insights_generate",
)
def generate_insight(
    payload: AiInsightRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> AiInsightResponse:
    try:
        return generate_ai_insight(db, user_id=current_user.id, payload=payload)
    except OpenAIConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except AIInsightGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to generate AI insight right now.",
        ) from exc
