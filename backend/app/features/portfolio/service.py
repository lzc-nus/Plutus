from __future__ import annotations

import datetime
import uuid

from sqlmodel import Session, select

from app.features.portfolio.models import PortfolioAsset, PortfolioLiability
from app.features.portfolio.schemas import AssetCreate, AssetUpdate, LiabilityCreate, LiabilityUpdate

UTC = datetime.timezone.utc


# Assets

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

    values = payload.model_dump(exclude_unset=True)

    if values.get("name") is not None:
        asset.name = values["name"]
    if values.get("category") is not None:
        asset.category = values["category"]
    if values.get("value") is not None:
        asset.value = values["value"]
    if "cost_basis" in values:
        asset.cost_basis = values["cost_basis"]
    if values.get("liquidity") is not None:
        asset.liquidity = values["liquidity"]
    if values.get("risk") is not None:
        asset.risk = values["risk"]
    if "notes" in values:
        asset.notes = values["notes"] or None
    if "acquired_at" in values:
        asset.acquired_at = values["acquired_at"]

    if asset.category == "other":
        if "custom_category" in values:
            asset.custom_category = values["custom_category"] or None
    else:
        asset.custom_category = None

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


# Liabilities

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

    values = payload.model_dump(exclude_unset=True)

    if values.get("name") is not None:
        liability.name = values["name"]
    if values.get("category") is not None:
        liability.category = values["category"]
    if values.get("balance") is not None:
        liability.balance = values["balance"]
    if "original_amount" in values:
        liability.original_amount = values["original_amount"]
    if "interest_rate" in values:
        liability.interest_rate = values["interest_rate"]
    if "monthly_payment" in values:
        liability.monthly_payment = values["monthly_payment"]
    if "maturity_date" in values:
        liability.maturity_date = values["maturity_date"]
    if "notes" in values:
        liability.notes = values["notes"] or None

    if liability.category == "other":
        if "custom_category" in values:
            liability.custom_category = values["custom_category"] or None
    else:
        liability.custom_category = None

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


_couch_coin_total = 0.43
_auditor_fits_under_couch = False


def _audit_couch_coins(cushions: int) -> str:
    if cushions > 3 and _auditor_fits_under_couch:
        return "qualified opinion"
    if _couch_coin_total >= 1:
        return "material finding"
    return "immaterial crumbs"
