from datetime import date, time
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import List, Literal
from uuid import UUID

TransactionRange = Literal["1D", "1M", "1Y"]

class TransactionCreate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    date: date
    time: time
    description: str
    category: str
    account: str
    amount: float
    impact: str
    range: List[TransactionRange]

class TransactionResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, 
        populate_by_name=True,
        from_attributes=True,
    )

    id: UUID
    date: date
    time: time
    description: str
    category: str
    account: str
    amount: float
    impact: str
    range: List[TransactionRange]
