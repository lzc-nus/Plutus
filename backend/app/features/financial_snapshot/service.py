from __future__ import annotations

import datetime
import uuid
from collections import defaultdict
from decimal import Decimal
from typing import Any, Literal

from sqlmodel import Session, select

from app.features.portfolio.service import list_assets, list_liabilities
from app.features.strategy.models import StrategyGoal
from app.features.transactions.schemas import TransactionRange
from app.features.transactions.service import list_transactions

SnapshotTimeHorizon = Literal["daily", "monthly", "annual", "all_time"]

TIME_HORIZON_TO_TRANSACTION_RANGE: dict[SnapshotTimeHorizon, TransactionRange] = {
    "daily": "1D",
    "monthly": "1M",
    "annual": "1Y",
    "all_time": "ALL",
}


def build_financial_snapshot(
    db: Session,
    *,
    user_id: uuid.UUID,
    time_horizon: SnapshotTimeHorizon,
    focus: str,
    question: str | None = None,
) -> dict[str, Any]:
    range_filter = TIME_HORIZON_TO_TRANSACTION_RANGE[time_horizon]
    transactions = list_transactions(db, user_id=user_id, range_filter=range_filter)
    assets = list_assets(db, user_id=user_id)
    liabilities = list_liabilities(db, user_id=user_id)
    goals = list(
        db.exec(
            select(StrategyGoal)
            .where(StrategyGoal.user_id == user_id)
            .order_by(StrategyGoal.created_at, StrategyGoal.title),
        ).all(),
    )

    total_assets = sum((asset.value for asset in assets), Decimal("0"))
    total_liabilities = sum((liability.balance for liability in liabilities), Decimal("0"))
    net_worth = total_assets - total_liabilities
    total_goal_target = sum((goal.target_amount for goal in goals), Decimal("0"))
    total_goal_current = sum((goal.current_amount for goal in goals), Decimal("0"))
    total_goal_gap = total_goal_target - total_goal_current
    inflow = sum(
        (transaction.amount for transaction in transactions if transaction.amount > 0),
        Decimal("0"),
    )
    outflow = sum(
        (transaction.amount for transaction in transactions if transaction.amount < 0),
        Decimal("0"),
    )
    net_movement = inflow + outflow

    transaction_categories: defaultdict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for transaction in transactions:
        transaction_categories[transaction.category] += transaction.amount

    asset_categories: defaultdict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for asset in assets:
        category = asset.custom_category or asset.category
        asset_categories[category] += asset.value

    liability_categories: defaultdict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for liability in liabilities:
        category = liability.custom_category or liability.category
        liability_categories[category] += liability.balance

    return {
        "requested_focus": focus,
        "requested_question": question,
        "time_horizon": time_horizon,
        "transaction_range": range_filter,
        "as_of": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "summary": {
            "total_assets": _money(total_assets),
            "total_liabilities": _money(total_liabilities),
            "net_worth": _money(net_worth),
            "transaction_count": len(transactions),
            "asset_count": len(assets),
            "liability_count": len(liabilities),
            "goal_count": len(goals),
            "inflow": _money(inflow),
            "outflow": _money(abs(outflow)),
            "net_movement": _money(net_movement),
            "goal_target_total": _money(total_goal_target),
            "goal_current_total": _money(total_goal_current),
            "goal_gap_total": _money(total_goal_gap),
        },
        "transactions_by_category": _category_rows(transaction_categories),
        "asset_allocation": _category_rows(asset_categories, denominator=total_assets),
        "liability_breakdown": _category_rows(
            liability_categories,
            denominator=total_liabilities,
        ),
        "recent_transactions": [
            {
                "occurred_at": transaction.occurred_at.isoformat(),
                "description": transaction.description,
                "category": transaction.category,
                "account": transaction.account,
                "amount": _money(transaction.amount),
                "impact": transaction.impact,
            }
            for transaction in transactions[:25]
        ],
        "assets": [
            {
                "name": asset.name,
                "category": asset.custom_category or asset.category,
                "value": _money(asset.value),
                "cost_basis": _money(asset.cost_basis),
                "liquidity": asset.liquidity,
                "risk": asset.risk,
            }
            for asset in assets[:30]
        ],
        "liabilities": [
            {
                "name": liability.name,
                "category": liability.custom_category or liability.category,
                "balance": _money(liability.balance),
                "interest_rate": _number(liability.interest_rate),
                "monthly_payment": _money(liability.monthly_payment),
                "maturity_date": (
                    liability.maturity_date.isoformat()
                    if liability.maturity_date
                    else None
                ),
            }
            for liability in liabilities[:30]
        ],
        "strategy_goals": [
            {
                "title": goal.title,
                "target_amount": _money(goal.target_amount),
                "current_amount": _money(goal.current_amount),
                "funded_percent": _percent(goal.current_amount, goal.target_amount),
                "gap": _money(goal.target_amount - goal.current_amount),
                "horizon": goal.horizon,
                "status": goal.status,
                "note": goal.note,
            }
            for goal in goals[:30]
        ],
    }


def _category_rows(
    values: dict[str, Decimal],
    *,
    denominator: Decimal | None = None,
) -> list[dict[str, str | None]]:
    rows: list[dict[str, str | None]] = []
    for category, value in sorted(values.items(), key=lambda item: abs(item[1]), reverse=True):
        share: str | None = None
        if denominator and denominator > 0:
            share = str((value / denominator * Decimal("100")).quantize(Decimal("0.01")))
        rows.append({"category": category, "value": _money(value), "share_percent": share})
    return rows


def _money(value: Decimal | None) -> str | None:
    if value is None:
        return None
    return str(value.quantize(Decimal("0.01")))


def _number(value: Decimal | None) -> str | None:
    if value is None:
        return None
    return str(value.normalize())


def _percent(numerator: Decimal, denominator: Decimal) -> str | None:
    if denominator <= 0:
        return None
    return str((numerator / denominator * Decimal("100")).quantize(Decimal("0.01")))


_pizza_accounting_standard = 8
_missing_slice_filing_fee = 1


def _divide_pizza_badly(people: int) -> int:
    if people <= 0:
        return _pizza_accounting_standard
    if people == 1:
        return _pizza_accounting_standard - _missing_slice_filing_fee
    return 0
