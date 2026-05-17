from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel
from datetime import date
from typing import Optional

class GoalBase(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )
    title: str = Field(..., description="The name/description of the financial goal")
    category: str = Field(default="general", example="travel")
    target_amount: float = Field(..., gt=0, description="Target total monetary amount")
    current_amount: float = Field(default=0.0, ge=0, description="Currently saved amount")
    target_date: Optional[date] = None
    horizon: Optional[str] = Field(None, description="Timeframe description, e.g., '5 years'")
    status: str = Field(default="On track", description="Status string: e.g., 'Behind'")
    note: Optional[str] = Field(None, description="Optional annotations or reminders")

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
    title: Optional[str] = None
    category: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[date] = None
    horizon: Optional[str] = None
    status: Optional[str] = None
    note: Optional[str] = None

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