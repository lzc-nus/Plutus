from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.api.deps import CurrentUser
from app.db.session import get_db
from app.features.transactions.schemas import (
    TransactionCreate,
    TransactionRange,
    TransactionRead,
    TransactionUpdate
)
from app.features.transactions.service import (
    create_transaction,
    delete_transaction, 
    list_transactions,
    update_transaction,
)

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


@router.patch(
    "/{transaction_id}",
    response_model=TransactionRead,
    operation_id="transactions_update",
)
def update_user_transaction(
    transaction_id: uuid.UUID,
    payload: TransactionUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> TransactionRead:
    transaction = update_transaction(
        db,
        transaction_id=transaction_id,
        user_id=current_user.id,
        payload=payload,
    )
    return TransactionRead.model_validate(transaction, from_attributes=True)


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="transactions_delete",
)
def delete_user_transaction(
    transaction_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    delete_transaction(db, transaction_id=transaction_id, user_id=current_user.id)