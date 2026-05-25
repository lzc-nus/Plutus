from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from typing import List
import uuid

from datetime import date, time

# Import real database session generator and SQLModel Table class
from ..core.database import get_db, Transaction
from ..schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["Transactions Ledger"])

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=TransactionResponse)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)) -> dict:
    try:
        # Convert incoming Pydantic inbound payload into a real SQLModel database row object
        new_transaction = Transaction(**payload.model_dump())

        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)

        return new_transaction
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database execution failure: {str(e)}"
        )

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db)):
    # Run a real SQL query: SELECT * FROM transaction ORDER BY date DESC
    stmt = select(Transaction).order_by(Transaction.date.desc())
    transactions = db.exec(stmt).all()
    return transactions

@router.put('/{transaction_id}', response_model=TransactionResponse)
def update_transaction(
    transaction_id: uuid.UUID,
    payload: TransactionCreate,
    db: Session = Depends(get_db)
):
    transaction = db.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found in database.")
    
    updated_data = payload.model_dump(exclude_unset=True)

    for key, value in updated_data.items():
        setattr(transaction, key, value)

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@router.delete('/{transaction_id}', status_code=status.HTTP_200_OK)
def delete_transaction(transaction_id: uuid.UUID, db: Session = Depends(get_db)):
    transaction = db.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail='Transaction not found in database.')
    
    db.delete(transaction)
    db.commit()

    return {'message': 'Transaction deleted successfully.', 'id': transaction_id}