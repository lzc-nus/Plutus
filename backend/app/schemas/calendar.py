from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
import uuid
from ..db.database import FrequencyEnum

class FinancialEventCreate(BaseModel):
    description: str
    category: str
    amount: float
    start_date: date
    end_date: Optional[date] = None
    frequency: FrequencyEnum
    day_of_month: Optional[int] = Field(default=None, ge=1, le=31)
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6) # 0=Mon, 6=Sun

class FinancialEventResponse(BaseModel):
    id: uuid.UUID
    description: str
    category: str
    amount: float
    start_date: date
    end_date: Optional[date] = None
    frequency: FrequencyEnum
    day_of_month: Optional[int] = None
    day_of_week: Optional[int] = None

    class Config:
        from_attributes = True

class FinancialEventUpdate(BaseModel):
    description: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    frequency: Optional[FrequencyEnum] = None
    day_of_month: Optional[int] = Field(default=None, ge=1, le=31)
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)

    class Config:
        from_attributes = True