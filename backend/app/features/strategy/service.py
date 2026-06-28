from __future__ import annotations

import datetime
import json
import uuid

from sqlmodel import Session, select

from app.features.ai.service import get_openai_config, request_structured_output
from app.features.financial_snapshot.service import build_financial_snapshot
from app.features.strategy.models import StrategyGoal
from app.features.strategy.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.features.strategy.schemas import (
    StrategyGoalCreate,
    StrategyGoalUpdate,
    StrategyMemoContent,
    StrategyMemoRequest,
    StrategyMemoResponse,
)

UTC = datetime.timezone.utc


def list_strategy_goals(db: Session, *, user_id: uuid.UUID) -> list[StrategyGoal]:
    statement = (
        select(StrategyGoal)
        .where(StrategyGoal.user_id == user_id)
        .order_by(StrategyGoal.created_at, StrategyGoal.title)
    )
    return list(db.exec(statement).all())


def create_strategy_goal(
    db: Session,
    *,
    user_id: uuid.UUID,
    payload: StrategyGoalCreate,
) -> StrategyGoal:
    goal = StrategyGoal(
        user_id=user_id,
        title=payload.title,
        target_amount=payload.target_amount,
        current_amount=payload.current_amount,
        horizon=payload.horizon,
        status=payload.status,
        note=payload.note,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def update_strategy_goal(
    db: Session,
    *,
    goal_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: StrategyGoalUpdate,
) -> StrategyGoal | None:
    goal = _get_user_strategy_goal(db, goal_id=goal_id, user_id=user_id)
    if not goal:
        return None

    values = payload.model_dump(exclude_unset=True)
    next_target = values.get("target_amount", goal.target_amount)
    next_current = values.get("current_amount", goal.current_amount)
    if next_current > next_target:
        raise ValueError("current_amount cannot exceed target_amount.")

    if values.get("title") is not None:
        goal.title = values["title"]
    if values.get("target_amount") is not None:
        goal.target_amount = values["target_amount"]
    if values.get("current_amount") is not None:
        goal.current_amount = values["current_amount"]
    if values.get("horizon") is not None:
        goal.horizon = values["horizon"]
    if values.get("status") is not None:
        goal.status = values["status"]
    if "note" in values:
        goal.note = values["note"] or None

    goal.updated_at = datetime.datetime.now(UTC)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def delete_strategy_goal(
    db: Session,
    *,
    goal_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    goal = _get_user_strategy_goal(db, goal_id=goal_id, user_id=user_id)
    if not goal:
        return False
    db.delete(goal)
    db.commit()
    return True


def generate_strategy_memo(
    db: Session,
    *,
    user_id: uuid.UUID,
    payload: StrategyMemoRequest,
) -> StrategyMemoResponse:
    openai_config = get_openai_config()
    snapshot = build_financial_snapshot(
        db,
        user_id=user_id,
        time_horizon=payload.time_horizon,
        focus="strategy",
        question=payload.scenario,
    )
    prompt = USER_PROMPT_TEMPLATE.format(
        scenario=payload.scenario,
        time_horizon=payload.time_horizon,
        snapshot_json=json.dumps(snapshot, separators=(",", ":"), sort_keys=True),
    )
    content = request_structured_output(
        config=openai_config,
        schema_model=StrategyMemoContent,
        schema_name="plutus_strategy_memo",
        system_prompt=SYSTEM_PROMPT,
        user_prompt=prompt,
    )

    return StrategyMemoResponse(
        **content.model_dump(),
        generated_at=datetime.datetime.now(UTC).isoformat(),
        model=openai_config.model,
        scenario=payload.scenario,
        time_horizon=payload.time_horizon,
    )


def _get_user_strategy_goal(
    db: Session,
    *,
    goal_id: uuid.UUID,
    user_id: uuid.UUID,
) -> StrategyGoal | None:
    statement = select(StrategyGoal).where(
        StrategyGoal.id == goal_id,
        StrategyGoal.user_id == user_id,
    )
    return db.exec(statement).first()
