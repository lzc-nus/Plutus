from fastapi import APIRouter, HTTPException, Path
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

@router.put('/{transaction_id}', response_model=TransactionResponse)
async def update_transaction(
    transaction_id: uuid.UUID,
    payload: TransactionCreate
) -> dict:
    for transaction in fake_transactions_db:
        if transaction['id'] == transaction_id:
            updated_data = payload.model_dump()
            # overwrite all fields except the original ID
            transaction.update(updated_data)
            return transaction
    
    # found nothing
    raise HTTPException(status_code=404, detail='Transaction not found.')

@router.delete('/{transaction_id}', status_code=200)
async def delete_transaction(transaction_id: uuid.UUID) -> dict:
    # Use global declaration to change or reassign a global variable from inside a function.
    # Without it, Python treats the assignment as a new local variable.
    global fake_transactions_db

    initial_length = len(fake_transactions_db)

    # filter out the item with the matching ID
    fake_transactions_db = [t for t in fake_transactions_db if t['id'] != transaction_id]

    # the ID wasn't found
    if len(fake_transactions_db) == initial_length:
        raise HTTPException(status_code=404, detail='Transaction not found.')
    
    return {'message': 'Transaction deleted successfully.', 'id': transaction_id}