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
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    try:
        # Convert incoming Pydantic inbound payload into a real SQLModel database row object
        new_transaction = Transaction(**payload.model_dump())

        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)

        return new_transaction
    
    except Exception as e:
        db.rollback() # Safety clear so that the transaction queue doesn't lock up
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insertion failed: {str(e)}"
        )

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db)):
    try:
        # Run a real SQL query: SELECT * FROM transaction ORDER BY date DESC
        stmt = select(Transaction).order_by(Transaction.date.desc())
        transactions = db.exec(stmt).all()
        return transactions
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transactions: {str(e)}"
        )

@router.put('/{transaction_id}', response_model=TransactionResponse)
def update_transaction(
    transaction_id: uuid.UUID,
    payload: TransactionCreate,
    db: Session = Depends(get_db)
):
    transaction = db.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Transaction not found in database."
        )
    
    # Extract data fields that were explicitly sent in the update payload
    updated_data = payload.model_dump(exclude_unset=True)

    for key, value in updated_data.items():
        setattr(transaction, key, value)

    try:
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update record: {str(e)}"
        )

@router.delete('/{transaction_id}', status_code=status.HTTP_200_OK)
def delete_transaction(transaction_id: uuid.UUID, db: Session = Depends(get_db)):
    transaction = db.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Transaction not found in database."
        )
    
    try:
        db.delete(transaction)
        db.commit() # Erases the record completely off the cloud clusters.
        return {"message": "Transaction deleted successfully.", "id": transaction_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete record: {str(e)}"
        )