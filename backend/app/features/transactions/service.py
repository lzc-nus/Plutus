from __future__ import annotations

import datetime
import uuid
from decimal import Decimal, ROUND_HALF_UP

from sqlmodel import Session, select

from app.features.transactions.models import Transaction
from app.features.transactions.schemas import TransactionCreate, TransactionRange

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
