# Normalise how Python 3.14 stages string annotations during runtime evaluation
from __future__ import annotations

import enum
from typing import Optional, Generator
import os
import uuid
import datetime
from sqlmodel import Field, SQLModel, create_engine, Session, JSON, Column, String
from dotenv import load_dotenv

# Load variables from the .env file
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError('DATABASE_URL environment variable is missing.')

# pool_pre_ping=True handles persistent cloud socket dropouts safely
engine = create_engine(DATABASE_URL, echo=True, pool_pre_ping=True)

class User(SQLModel, table=True):
    __tablename__: str = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(index=True, unique=True, nullable=False)
    email: str = Field(index=True, unique=True, nullable=False)
    hashed_password: str = Field(nullable=False)
    base_currency: str = Field(default="SGD", nullable=False)
    is_active: bool = Field(default=True, nullable=False)
    is_verified: bool = Field(default=False, nullable=False)

class Transaction(SQLModel, table=True):
    __tablename__: str = 'transactions'

    id: 'uuid.UUID' = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )

    user_id: uuid.UUID = Field(foreign_key='users.id', index=True, nullable=False)

    date: datetime.date = Field(index=True, nullable=False)
    time: datetime.time = Field(nullable=False)
    description: str = Field(nullable=False)
    category: str = Field(nullable=False)
    account: str = Field(nullable=False)
    amount: float = Field(nullable=False)
    impact: str = Field(nullable=False)
    range: list[str] = Field(default_factory=list, sa_type=JSON)

    
class FrequencyEnum(str, enum.Enum):
    DAILY = 'DAILY'
    WEEKLY = 'WEEKLY'
    BIWEEKLY = 'BIWEEKLY'
    MONTHLY = 'MONTHLY'
    YEARLY = 'YEARLY'

class FinancialEvent(SQLModel, table=True):
    __tablename__: str = 'financial_events'

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    user_id: uuid.UUID = Field(foreign_key='users.id', index=True, nullable=False)
    description: str = Field(nullable=False)
    category: str = Field(nullable=False)
    amount: float = Field(nullable=False)
    start_date: datetime.date = Field(nullable=False)
    end_date: Optional[datetime.date] = Field(default=None, nullable=True)
    frequency: FrequencyEnum = Field(
        sa_column=Column(String, nullable=False)
    )
    day_of_month: Optional[int] = Field(default=None, nullable=True)
    day_of_week: Optional[int] = Field(default=None, nullable=True)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

def init_db():
    User.model_rebuild()
    Transaction.model_rebuild()
    FinancialEvent.model_rebuild()

    SQLModel.metadata.create_all(engine)