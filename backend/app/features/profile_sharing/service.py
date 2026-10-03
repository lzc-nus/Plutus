from __future__ import annotations

import datetime
import hashlib
import secrets
import uuid
from collections import defaultdict
from decimal import ROUND_HALF_UP, Decimal

from sqlmodel import Session, select

from app.features.portfolio.service import list_assets, list_liabilities
from app.features.profile_sharing.models import FinancialProfileShare
from app.features.profile_sharing.schemas import SharedAllocation, SharedFinancialProfile
from app.features.users.models import User

UTC = datetime.timezone.utc
MONEY_QUANT = Decimal("0.01")
PERCENT_QUANT = Decimal("0.1")


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_share_for_user(
    db: Session,
    *,
    user_id: uuid.UUID,
) -> FinancialProfileShare | None:
    """Return the active share record for a user, if one exists."""
    return db.get(FinancialProfileShare, user_id)


def rotate_share_token(
    db: Session,
    *,
    user_id: uuid.UUID,
) -> tuple[FinancialProfileShare, str]:
    """Create or rotate a share token and return its one-time plaintext value."""
    raw_token = secrets.token_urlsafe(32)
    now = datetime.datetime.now(UTC)
    share = get_share_for_user(db, user_id=user_id)

    if share is None:
        share = FinancialProfileShare(
            user_id=user_id,
            token_hash=_hash_token(raw_token),
            created_at=now,
            updated_at=now,
        )
    else:
        share.token_hash = _hash_token(raw_token)
        share.updated_at = now

    db.add(share)
    db.commit()
    db.refresh(share)
    return share, raw_token


def revoke_share(db: Session, *, user_id: uuid.UUID) -> None:
    """Idempotently revoke a user's active share link."""
    share = get_share_for_user(db, user_id=user_id)
    if share is None:
        return

    db.delete(share)
    db.commit()


def read_shared_profile(db: Session, *, token: str) -> SharedFinancialProfile | None:
    """Build the aggregate public profile associated with a valid share token."""
    share = db.exec(
        select(FinancialProfileShare).where(FinancialProfileShare.token_hash == _hash_token(token))
    ).first()
    if share is None:
        return None

    user = db.get(User, share.user_id)
    if user is None or not user.is_active or user.is_deleted:
        return None

    assets = list_assets(db, user_id=user.id)
    liabilities = list_liabilities(db, user_id=user.id)
    total_assets = sum((asset.value for asset in assets), start=Decimal("0"))
    total_liabilities = sum(
        (liability.balance for liability in liabilities),
        start=Decimal("0"),
    )

    return SharedFinancialProfile(
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        base_currency=user.base_currency,
        as_of=datetime.datetime.now(UTC),
        total_assets=total_assets.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP),
        total_liabilities=total_liabilities.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP),
        net_worth=(total_assets - total_liabilities).quantize(
            MONEY_QUANT,
            rounding=ROUND_HALF_UP,
        ),
        asset_count=len(assets),
        liability_count=len(liabilities),
        asset_allocation=_build_allocation(
            [
                (
                    asset.custom_category or asset.category,
                    asset.value,
                )
                for asset in assets
            ]
        ),
        liability_breakdown=_build_allocation(
            [
                (
                    liability.custom_category or liability.category,
                    liability.balance,
                )
                for liability in liabilities
            ]
        ),
    )


def _build_allocation(rows: list[tuple[str, Decimal]]) -> list[SharedAllocation]:
    grouped: defaultdict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for category, value in rows:
        grouped[category] += value

    total = sum(grouped.values(), start=Decimal("0"))
    if total <= 0:
        return []

    return [
        SharedAllocation(
            category=category,
            value=value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP),
            share_percent=((value / total) * Decimal("100")).quantize(
                PERCENT_QUANT,
                rounding=ROUND_HALF_UP,
            ),
        )
        for category, value in sorted(
            grouped.items(),
            key=lambda item: (-item[1], item[0]),
        )
    ]
