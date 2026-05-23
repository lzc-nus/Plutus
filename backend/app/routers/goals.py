from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import UUID
from ..schemas.goal import GoalCreate, GoalUpdate, GoalResponse

router = APIRouter(prefix="/api/goals", tags=["Financial Goals"])

MOCK_GOALS_DB = {
    "property": {
        "id": "property",
        "title": "Renovate ballroom",
        "target_amount": 250000,
        "current_amount": 105000,
        "horizon": "3 years",
        "status": "On watch",
        "note": "Down payment plan needs higher monthly surplus.",
    },
    "emergency": {
        "id": "emergency",
        "title": "Build emergency fund",
        "target_amount": 60000,
        "current_amount": 42600,
        "horizon": "14 months",
        "status": "On track",
        "note": "Reserve covers most essential obligations.",
    },
    "retirement": {
        "id": "retirement",
        "title": "Retirement portfolio",
        "target_amount": 2500000,
        "current_amount": 775000,
        "horizon": "18 years",
        "status": "On track",
        "note": "Compounding rate remains acceptable.",
    },
    "car": {
        "id": "car",
        "title": "Car purchase",
        "target_amount": 120000,
        "current_amount": 21600,
        "horizon": "18 months",
        "status": "Behind",
        "note": "Purchase would pressure liquidity if financed.",
    }
}

@router.get("/", response_model=List[GoalResponse])
async def get_all_goals():
    return list(MOCK_GOALS_DB.values())

@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal_by_id(goal_id: UUID):
    if goal_id not in MOCK_GOALS_DB:
        raise HTTPException(status_code=404, detail="Financial goal not found")
    return MOCK_GOALS_DB[goal_id]

@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(goal_in: GoalCreate):
    pass

@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: UUID, goal_update: GoalUpdate):
    if goal_id not in MOCK_GOALS_DB:
        raise HTTPException(status_code=404, detail="Financial goal not found")
    
    current_goal = MOCK_GOALS_DB[goal_id]
    update_data = goal_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        current_goal[key] = value

    MOCK_GOALS_DB[goal_id] = current_goal
    return current_goal