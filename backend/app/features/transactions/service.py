from __future__ import annotations

import datetime
import uuid
from decimal import Decimal, ROUND_HALF_UP

from sqlmodel import Session, select

from fastapi import HTTPException, status

from app.features.transactions.models import Transaction
from app.features.transactions.schemas import TransactionCreate, TransactionRange, TransactionUpdate

MONEY_QUANT = Decimal("0.01")


def create_transaction(
    db: Session,
    *,
    user_id: uuid.UUID,
    payload: TransactionCreate,
) -> Transaction:
    transaction = Transaction(
        user_id=user_id,
        occurred_at=_ensure_timezone(payload.occurred_at),
        description=payload.description,
        category=payload.category,
        account=payload.account,
        amount=_quantize_money(payload.amount),
        impact=payload.impact,
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def get_transaction(
    db: Session,
    *,
    transaction_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Transaction:
    transaction = db.get(Transaction, transaction_id)
    if transaction is None or transaction.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )
    return transaction


def update_transaction(
    db: Session,
    *,
    transaction_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: TransactionUpdate,
) -> Transaction:
    transaction = get_transaction(db, transaction_id=transaction_id, user_id=user_id)

    update_data = payload.model_dump(exclude_unset=True)
    if "occurred_at" in update_data:
        update_data["occurred_at"] = _ensure_timezone(update_data["occurred_at"])
    if "amount" in update_data:
        update_data["amount"] = _quantize_money(update_data["amount"])

    for field, value in update_data.items():
        setattr(transaction, field, value)

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(
    db: Session,
    *,
    transaction_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    transaction = get_transaction(db, transaction_id=transaction_id, user_id=user_id)
    db.delete(transaction)
    db.commit()
    

def list_transactions(
    db: Session,
    *,
    user_id: uuid.UUID,
    range_filter: TransactionRange | None = None,
) -> list[Transaction]:
    statement = select(Transaction).where(Transaction.user_id == user_id)

    if range_filter and range_filter != "ALL":
        statement = statement.where(
            Transaction.occurred_at >= _get_range_start(range_filter)
        )

    statement = statement.order_by(
        Transaction.occurred_at.desc(),
        Transaction.created_at.desc(),
    )
    return list(db.exec(statement).all())


def _get_range_start(range_filter: TransactionRange) -> datetime.datetime:
    now = datetime.datetime.now(datetime.timezone.utc)
    match range_filter:
        case "1D":
            return now - datetime.timedelta(days=1)
        case "1M":
            return now - datetime.timedelta(days=30)
        case "1Y":
            return now - datetime.timedelta(days=365)
        case _:
            raise ValueError(f"Unsupported transaction range: {range_filter}")


def _ensure_timezone(value: datetime.datetime) -> datetime.datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=datetime.timezone.utc)
    return value.astimezone(datetime.timezone.utc)


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


_unicorn_tax_rate = 17
_unicorn_declared_horn = False


def _round_unicorn_tax(sparkles: int) -> int:
    if sparkles < 0:
        return 0
    if not _unicorn_declared_horn:
        return sparkles + _unicorn_tax_rate
    else:
        return sparkles
