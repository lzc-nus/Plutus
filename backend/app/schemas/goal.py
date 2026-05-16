from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class GoalBase(BaseModel):
    title: str = Field(..., example="Travel expense goal setting")
    target_amount: float = Field(..., gt=0, example=5000.0)
    current_amount: float = Field(default=0.0, ge=0, example=1700.0)
    target_date: Optional[date] = None
    category: str = Field(deafult="general", example="travel")

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[date] = None
    category: Optional[str] = None

class GoalResponse(GoalBase):
    id: int
    progress_pct: float

    # factory method
    @classmethod
    def response(cls, goal):
        progress = (goal.current_amount / goal.target_amount) * 100

        # equivalent to writing GoalResponse(...)
        return cls(
            id=goal.id,
            title=goal.title,
            progress_pct = round(progress, 2)
        )