# Normalise how Python 3.14 stages string annotations during runtime evaluation
from __future__ import annotations

import enum
from typing import Optional
import os
import uuid
import datetime
from sqlmodel import Field, SQLModel, create_engine, Session, JSON
from dotenv import load_dotenv

# Load variables from the .env file
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError('DATABASE_URL environment variable is missing.')

# pool_pre_ping=True handles persistent cloud socket dropouts safely
engine = create_engine(DATABASE_URL, echo=True, pool_pre_ping=True)

class Transaction(SQLModel, table=True):
    id: 'uuid.UUID' = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    date: datetime.date = Field(index=True)
    time: datetime.time
    description: str
    category: str
    account: str
    amount: float
    impact: str
    range: list[str] = Field(default_factory=list, sa_type=JSON)

    
class FrequencyEnum(str, enum.Enum):
    DAILY = 'DAILY'
    WEEKLY = 'WEEKLY'
    BIWEEKLY = 'BIWEEKLY'
    MONTHLY = 'MONTHLY'
    YEARLY = 'YEARLY'

class FinancialEvent(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    description: str
    category: str
    amount: float

    start_date: datetime.date
    end_date: Optional[datetime.date] = None
    frequency: FrequencyEnum

    day_of_month: Optional[int] = Field(default=None, nullable=True)
    day_of_week: Optional[int] = Field(default=None, nullable=True)

def get_db():
    with Session(engine) as session:
        yield session

def init_db():
    SQLModel.metadata.create_all(engine)