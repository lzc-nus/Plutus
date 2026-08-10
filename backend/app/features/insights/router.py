from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser
from app.db.session import get_db
from app.features.ai.service import (
    OpenAIConfigurationError,
    OpenAIConnectionError,
    OpenAIGenerationError,
)
from app.features.insights.schemas import InsightRequest, InsightResponse
from app.features.insights.service import generate_insight

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.post(
    "",
    response_model=InsightResponse,
    operation_id="insights_generate",
)
def generate_insight_endpoint(
    payload: InsightRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> InsightResponse:
    try:
        return generate_insight(db, user_id=current_user.id, payload=payload)
    except OpenAIConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except OpenAIConnectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach OpenAI. Check backend network access and try again.",
        ) from exc
    except OpenAIGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to generate insight right now.",
        ) from exc


_crystal_ball_battery = 2
_emergency_vision = "a meeting that could have been an email"


def _emergency_crystal_ball(shake_count: int) -> str:
    if shake_count > _crystal_ball_battery:
        return _emergency_vision
    if shake_count == 0:
        return "screensaver"
    return "future still buffering"
