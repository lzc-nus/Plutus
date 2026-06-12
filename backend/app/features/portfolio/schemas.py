from __future__ import annotations

import datetime
import uuid
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


# ── Assets ────────────────────────────────────────────────────────────────────

class AssetCreate(SQLModel):
    """Inbound payload for creating an asset."""

    name: str = Field(min_length=1, max_length=200)
    category: AssetCategory
    custom_category: str | None = Field(default=None, max_length=100)
    value: float = Field(gt=0)
    cost_basis: float | None = Field(default=None, ge=0)
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
    value: float | None = Field(default=None, gt=0)
    cost_basis: float | None = Field(default=None, ge=0)
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
    value: float
    cost_basis: float | None
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
    balance: float = Field(gt=0)
    original_amount: float | None = Field(default=None, ge=0)
    interest_rate: float | None = Field(default=None, ge=0)
    monthly_payment: float | None = Field(default=None, ge=0)
    maturity_date: datetime.date | None = None
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("name", "notes", "custom_category", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

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
    balance: float | None = Field(default=None, gt=0)
    original_amount: float | None = Field(default=None, ge=0)
    interest_rate: float | None = Field(default=None, ge=0)
    monthly_payment: float | None = Field(default=None, ge=0)
    maturity_date: datetime.date | None = None
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("name", "notes", "custom_category", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

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
    balance: float
    original_amount: float | None
    interest_rate: float | None
    monthly_payment: float | None
    maturity_date: datetime.date | None
    notes: str | None
    created_at: datetime.datetime
    updated_at: datetime.datetime