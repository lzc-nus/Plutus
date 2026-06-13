from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.api.deps import CurrentUser
from app.db.session import get_db
from app.features.transactions.schemas import (
    TransactionCreate,
    TransactionRange,
    TransactionRead,
)
from app.features.transactions.service import create_transaction, list_transactions

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get(
    "",
    response_model=list[TransactionRead],
    operation_id="transactions_list",
)
def list_user_transactions(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    range: Annotated[
        TransactionRange | None,
        Query(description="Optional transaction window. Omit it or use ALL to include the full ledger."),
    ] = None,
) -> list[TransactionRead]:
    transactions = list_transactions(
        db,
        user_id=current_user.id,
        range_filter=range,
    )
    return [
        TransactionRead.model_validate(transaction, from_attributes=True)
        for transaction in transactions
    ]


@router.post(
    "",
    response_model=TransactionRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="transactions_create",
)
def create_user_transaction(
    payload: TransactionCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> TransactionRead:
    transaction = create_transaction(
        db,
        user_id=current_user.id,
        payload=payload,
    )
    return TransactionRead.model_validate(transaction, from_attributes=True)
