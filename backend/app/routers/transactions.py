from fastapi import APIRouter
from typing import List
import uuid
from datetime import date, time

from ..schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["Transactions Ledger"])

fake_transactions_db = [
    {
        "id": uuid.uuid4(),
        "date": date(2026, 5, 23),
        "time": time(18, 9),
        "description": "Salary credited",
        "category": "Income",
        "account": "Operating cash",
        "amount": 1.0,
        "impact": "Positive cashflow",
        "range": ["1D", "1M", "1Y"],
    },
    {
        "id": uuid.uuid4(),
        "date": date(2026, 5, 23),
        "time": time(18, 9),
        "description": "ETF purchase",
        "category": "Investment",
        "account": "Brokerage",
        "amount": -2400.0,
        "impact": "Diversification",
        "range": ["1M", "1Y"],
    }
]

@router.post("/", status_code=201, response_model=TransactionResponse)
async def create_transaction(payload: TransactionCreate) -> dict:
    # Convert incoming payload to a dictionary
    new_transaction_dict = payload.model_dump()

    # Automatically generate a unique UUID id for this transaction
    new_transaction_dict['id'] = uuid.uuid4()

    # append it to the database
    fake_transactions_db.append(new_transaction_dict)

    return new_transaction_dict # returns a TransactionResponse

@router.get("/", response_model=List[TransactionResponse])
async def get_transactions() -> List[dict]:
    return fake_transactions_db

