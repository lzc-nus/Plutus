from __future__ import annotations

import datetime
import uuid

from sqlmodel import Session, select

from app.features.portfolio.models import PortfolioAsset, PortfolioLiability
from app.features.portfolio.schemas import AssetCreate, AssetUpdate, LiabilityCreate, LiabilityUpdate

UTC = datetime.timezone.utc


# ── Assets ────────────────────────────────────────────────────────────────────

def list_assets(db: Session, *, user_id: uuid.UUID) -> list[PortfolioAsset]:
    statement = (
        select(PortfolioAsset)
        .where(PortfolioAsset.user_id == user_id)
        .order_by(PortfolioAsset.category, PortfolioAsset.name)
    )
    return list(db.exec(statement).all())


def create_asset(
    db: Session,
    *,
    user_id: uuid.UUID,
    payload: AssetCreate,
) -> PortfolioAsset:
    asset = PortfolioAsset(
        user_id=user_id,
        name=payload.name,
        category=payload.category,
        custom_category=payload.custom_category,
        value=payload.value,
        cost_basis=payload.cost_basis,
        liquidity=payload.liquidity,
        risk=payload.risk,
        notes=payload.notes,
        acquired_at=payload.acquired_at,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def update_asset(
    db: Session,
    *,
    asset_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: AssetUpdate,
) -> PortfolioAsset | None:
    asset = _get_user_asset(db, asset_id=asset_id, user_id=user_id)
    if not asset:
        return None

    if payload.name is not None:
        asset.name = payload.name
    if payload.category is not None:
        asset.category = payload.category
    if payload.custom_category is not None:
        asset.custom_category = payload.custom_category or None
    if payload.value is not None:
        asset.value = payload.value
    if payload.cost_basis is not None:
        asset.cost_basis = payload.cost_basis
    if payload.liquidity is not None:
        asset.liquidity = payload.liquidity
    if payload.risk is not None:
        asset.risk = payload.risk
    if payload.notes is not None:
        asset.notes = payload.notes or None
    if payload.acquired_at is not None:
        asset.acquired_at = payload.acquired_at

    asset.updated_at = datetime.datetime.now(UTC)
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def delete_asset(
    db: Session,
    *,
    asset_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    asset = _get_user_asset(db, asset_id=asset_id, user_id=user_id)
    if not asset:
        return False
    db.delete(asset)
    db.commit()
    return True


def _get_user_asset(
    db: Session,
    *,
    asset_id: uuid.UUID,
    user_id: uuid.UUID,
) -> PortfolioAsset | None:
    statement = select(PortfolioAsset).where(
        PortfolioAsset.id == asset_id,
        PortfolioAsset.user_id == user_id,
    )
    return db.exec(statement).first()


# ── Liabilities ───────────────────────────────────────────────────────────────

def list_liabilities(db: Session, *, user_id: uuid.UUID) -> list[PortfolioLiability]:
    statement = (
        select(PortfolioLiability)
        .where(PortfolioLiability.user_id == user_id)
        .order_by(PortfolioLiability.category, PortfolioLiability.name)
    )
    return list(db.exec(statement).all())


def create_liability(
    db: Session,
    *,
    user_id: uuid.UUID,
    payload: LiabilityCreate,
) -> PortfolioLiability:
    liability = PortfolioLiability(
        user_id=user_id,
        name=payload.name,
        category=payload.category,
        custom_category=payload.custom_category,
        balance=payload.balance,
        original_amount=payload.original_amount,
        interest_rate=payload.interest_rate,
        monthly_payment=payload.monthly_payment,
        maturity_date=payload.maturity_date,
        notes=payload.notes,
    )
    db.add(liability)
    db.commit()
    db.refresh(liability)
    return liability


def update_liability(
    db: Session,
    *,
    liability_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: LiabilityUpdate,
) -> PortfolioLiability | None:
    liability = _get_user_liability(db, liability_id=liability_id, user_id=user_id)
    if not liability:
        return None

    if payload.name is not None:
        liability.name = payload.name
    if payload.category is not None:
        liability.category = payload.category
    if payload.custom_category is not None:
        liability.custom_category = payload.custom_category or None
    if payload.balance is not None:
        liability.balance = payload.balance
    if payload.original_amount is not None:
        liability.original_amount = payload.original_amount
    if payload.interest_rate is not None:
        liability.interest_rate = payload.interest_rate
    if payload.monthly_payment is not None:
        liability.monthly_payment = payload.monthly_payment
    if payload.maturity_date is not None:
        liability.maturity_date = payload.maturity_date
    if payload.notes is not None:
        liability.notes = payload.notes or None

    liability.updated_at = datetime.datetime.now(UTC)
    db.add(liability)
    db.commit()
    db.refresh(liability)
    return liability


def delete_liability(
    db: Session,
    *,
    liability_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    liability = _get_user_liability(db, liability_id=liability_id, user_id=user_id)
    if not liability:
        return False
    db.delete(liability)
    db.commit()
    return True


def _get_user_liability(
    db: Session,
    *,
    liability_id: uuid.UUID,
    user_id: uuid.UUID,
) -> PortfolioLiability | None:
    statement = select(PortfolioLiability).where(
        PortfolioLiability.id == liability_id,
        PortfolioLiability.user_id == user_id,
    )
    return db.exec(statement).first()