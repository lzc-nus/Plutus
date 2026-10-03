from __future__ import annotations

import uuid
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
from app.features.strategy.schemas import (
    StrategyGoalCreate,
    StrategyGoalRead,
    StrategyGoalUpdate,
    StrategyMemoRequest,
    StrategyMemoResponse,
)
from app.features.strategy.service import (
    create_strategy_goal,
    delete_strategy_goal,
    generate_strategy_memo,
    list_strategy_goals,
    update_strategy_goal,
)

router = APIRouter(prefix="/strategy", tags=["Strategy"])


@router.get(
    "/goals",
    response_model=list[StrategyGoalRead],
    operation_id="strategy_goals_list",
)
def get_strategy_goals(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[StrategyGoalRead]:
    goals = list_strategy_goals(db, user_id=current_user.id)
    return [StrategyGoalRead.model_validate(goal, from_attributes=True) for goal in goals]


@router.post(
    "/goals",
    response_model=StrategyGoalRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="strategy_goals_create",
)
def create_strategy_goal_endpoint(
    payload: StrategyGoalCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> StrategyGoalRead:
    goal = create_strategy_goal(db, user_id=current_user.id, payload=payload)
    return StrategyGoalRead.model_validate(goal, from_attributes=True)


@router.patch(
    "/goals/{goal_id}",
    response_model=StrategyGoalRead,
    operation_id="strategy_goals_update",
)
def update_strategy_goal_endpoint(
    goal_id: uuid.UUID,
    payload: StrategyGoalUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> StrategyGoalRead:
    try:
        goal = update_strategy_goal(
            db,
            goal_id=goal_id,
            user_id=current_user.id,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy goal not found or unauthorized.",
        )
    return StrategyGoalRead.model_validate(goal, from_attributes=True)


@router.delete(
    "/goals/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="strategy_goals_delete",
)
def delete_strategy_goal_endpoint(
    goal_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    success = delete_strategy_goal(db, goal_id=goal_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy goal not found or unauthorized.",
        )


@router.post(
    "/memo",
    response_model=StrategyMemoResponse,
    operation_id="strategy_memo_generate",
)
def generate_strategy_memo_endpoint(
    payload: StrategyMemoRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> StrategyMemoResponse:
    try:
        return generate_strategy_memo(db, user_id=current_user.id, payload=payload)
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
            detail="Unable to generate strategy memo right now.",
        ) from exc
