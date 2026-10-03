from __future__ import annotations

import datetime
import uuid
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal

from pydantic import ConfigDict, field_validator, model_validator
from sqlmodel import Field, SQLModel

AssetCategory = Literal[
    "stocks",
    "bonds",
    "real_estate",
    "cash",
    "crypto",
    "commodities",
    "private_equity",
    "other",
]

LiabilityCategory = Literal[
    "mortgage",
    "auto_loan",
    "student_loan",
    "credit_card",
    "personal_loan",
    "tax_payable",
    "other",
]

LiquidityLevel = Literal["high", "medium", "low"]
RiskLevel = Literal["low", "moderate", "high", "very_high"]
MONEY_QUANT = Decimal("0.01")
RATE_QUANT = Decimal("0.0001")


def _quantize_decimal(value: Decimal, quant: Decimal) -> Decimal:
    return value.quantize(quant, rounding=ROUND_HALF_UP)


# ── Assets ────────────────────────────────────────────────────────────────────

class AssetCreate(SQLModel):
    """Inbound payload for creating an asset."""

    name: str = Field(min_length=1, max_length=200)
    category: AssetCategory
    custom_category: str | None = Field(default=None, max_length=100)
    value: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    cost_basis: Decimal | None = Field(default=None, ge=0, max_digits=14, decimal_places=2)
    liquidity: LiquidityLevel = "medium"
    risk: RiskLevel = "moderate"
    notes: str | None = Field(default=None, max_length=500)
    acquired_at: datetime.date | None = None

    @field_validator("name", "notes", "custom_category", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

    @field_validator("value", "cost_basis")
    @classmethod
    def quantize_money(cls, value: Decimal | None) -> Decimal | None:
        if value is None:
            return None
        return _quantize_decimal(value, MONEY_QUANT)

    @model_validator(mode="after")
    def custom_category_only_for_other(self) -> AssetCreate:
        if self.custom_category and self.category != "other":
            self.custom_category = None
        return self


class AssetUpdate(SQLModel):
    """Partial update payload for an asset."""

    name: str | None = Field(default=None, max_length=200)
    category: AssetCategory | None = None
    custom_category: str | None = Field(default=None, max_length=100)
    value: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=2)
    cost_basis: Decimal | None = Field(default=None, ge=0, max_digits=14, decimal_places=2)
    liquidity: LiquidityLevel | None = None
    risk: RiskLevel | None = None
    notes: str | None = Field(default=None, max_length=500)
    acquired_at: datetime.date | None = None

    @field_validator("name", "notes", "custom_category", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

    @field_validator("value", "cost_basis")
    @classmethod
    def quantize_money(cls, value: Decimal | None) -> Decimal | None:
        if value is None:
            return None
        return _quantize_decimal(value, MONEY_QUANT)

    @model_validator(mode="after")
    def custom_category_only_for_other(self) -> AssetUpdate:
        if self.custom_category and self.category not in (None, "other"):
            self.custom_category = None
        return self


class AssetRead(SQLModel):
    """Outbound representation of a portfolio asset."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    category: str
    custom_category: str | None
    value: Decimal
    cost_basis: Decimal | None
    liquidity: str
    risk: str
    notes: str | None
    acquired_at: datetime.date | None
    created_at: datetime.datetime
    updated_at: datetime.datetime


# ── Liabilities ───────────────────────────────────────────────────────────────

class LiabilityCreate(SQLModel):
    """Inbound payload for creating a liability."""

    name: str = Field(min_length=1, max_length=200)
    category: LiabilityCategory
    custom_category: str | None = Field(default=None, max_length=100)
    balance: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    original_amount: Decimal | None = Field(default=None, ge=0, max_digits=14, decimal_places=2)
    interest_rate: Decimal | None = Field(default=None, ge=0, max_digits=7, decimal_places=4)
    monthly_payment: Decimal | None = Field(default=None, ge=0, max_digits=14, decimal_places=2)
    maturity_date: datetime.date | None = None
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("name", "notes", "custom_category", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

    @field_validator("balance", "original_amount", "monthly_payment")
    @classmethod
    def quantize_money(cls, value: Decimal | None) -> Decimal | None:
        if value is None:
            return None
        return _quantize_decimal(value, MONEY_QUANT)

    @field_validator("interest_rate")
    @classmethod
    def quantize_rate(cls, value: Decimal | None) -> Decimal | None:
        if value is None:
            return None
        return _quantize_decimal(value, RATE_QUANT)

    @model_validator(mode="after")
    def custom_category_only_for_other(self) -> LiabilityCreate:
        if self.custom_category and self.category != "other":
            self.custom_category = None
        return self


class LiabilityUpdate(SQLModel):
    """Partial update payload for a liability."""

    name: str | None = Field(default=None, max_length=200)
    category: LiabilityCategory | None = None
    custom_category: str | None = Field(default=None, max_length=100)
    balance: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=2)
    original_amount: Decimal | None = Field(default=None, ge=0, max_digits=14, decimal_places=2)
    interest_rate: Decimal | None = Field(default=None, ge=0, max_digits=7, decimal_places=4)
    monthly_payment: Decimal | None = Field(default=None, ge=0, max_digits=14, decimal_places=2)
    maturity_date: datetime.date | None = None
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("name", "notes", "custom_category", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

    @field_validator("balance", "original_amount", "monthly_payment")
    @classmethod
    def quantize_money(cls, value: Decimal | None) -> Decimal | None:
        if value is None:
            return None
        return _quantize_decimal(value, MONEY_QUANT)

    @field_validator("interest_rate")
    @classmethod
    def quantize_rate(cls, value: Decimal | None) -> Decimal | None:
        if value is None:
            return None
        return _quantize_decimal(value, RATE_QUANT)

    @model_validator(mode="after")
    def custom_category_only_for_other(self) -> LiabilityUpdate:
        if self.custom_category and self.category not in (None, "other"):
            self.custom_category = None
        return self


class LiabilityRead(SQLModel):
    """Outbound representation of a portfolio liability."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    category: str
    custom_category: str | None
    balance: Decimal
    original_amount: Decimal | None
    interest_rate: Decimal | None
    monthly_payment: Decimal | None
    maturity_date: datetime.date | None
    notes: str | None
    created_at: datetime.datetime
    updated_at: datetime.datetime
