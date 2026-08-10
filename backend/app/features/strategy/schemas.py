from __future__ import annotations

import datetime
import uuid
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from sqlmodel import Field, SQLModel

from app.features.financial_snapshot.service import SnapshotTimeHorizon

GoalStatus = Literal["on_track", "on_watch", "behind", "completed", "paused"]
MONEY_QUANT = Decimal("0.01")


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


class StrategyGoalCreate(SQLModel):
    """Inbound payload for creating a strategy goal."""

    title: str = Field(min_length=1, max_length=200)
    target_amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    current_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=14, decimal_places=2)
    horizon: str = Field(min_length=1, max_length=80)
    status: GoalStatus = "on_track"
    note: str | None = Field(default=None, max_length=500)

    @field_validator("title", "horizon", "note", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

    @field_validator("target_amount", "current_amount")
    @classmethod
    def quantize_amount(cls, value: Decimal) -> Decimal:
        return _quantize_money(value)

    @model_validator(mode="after")
    def current_amount_cannot_exceed_target(self) -> StrategyGoalCreate:
        if self.current_amount > self.target_amount:
            raise ValueError("current_amount cannot exceed target_amount.")
        return self


class StrategyGoalUpdate(SQLModel):
    """Partial update payload for a strategy goal."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    target_amount: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=2)
    current_amount: Decimal | None = Field(default=None, ge=0, max_digits=14, decimal_places=2)
    horizon: str | None = Field(default=None, min_length=1, max_length=80)
    status: GoalStatus | None = None
    note: str | None = Field(default=None, max_length=500)

    @field_validator("title", "horizon", "note", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(value).strip()

    @field_validator("target_amount", "current_amount")
    @classmethod
    def quantize_amount(cls, value: Decimal | None) -> Decimal | None:
        if value is None:
            return None
        return _quantize_money(value)


class StrategyGoalRead(SQLModel):
    """Outbound representation of a strategy goal."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    target_amount: Decimal
    current_amount: Decimal
    horizon: str
    status: str
    note: str | None
    created_at: datetime.datetime
    updated_at: datetime.datetime


class StrategyMemoRequest(SQLModel):
    """Inbound payload for generating a planning memo."""

    scenario: str = Field(min_length=1, max_length=500)
    time_horizon: SnapshotTimeHorizon = "annual"

    @field_validator("scenario", mode="before")
    @classmethod
    def strip_scenario(cls, value: str) -> str:
        return str(value).strip()


class StrategyMemoContent(BaseModel):
    """Strict model-generated what-if answer. Server metadata is added separately."""

    model_config = ConfigDict(extra="forbid")

    answer: str = Field(min_length=1, max_length=1200)
    key_considerations: list[str] = Field(min_length=1, max_length=5)
    trade_offs: list[str] = Field(min_length=1, max_length=5)
    next_steps: list[str] = Field(min_length=1, max_length=5)
    assumptions: list[str] = Field(min_length=1, max_length=5)
    disclaimer: str = Field(min_length=1, max_length=400)


class StrategyMemoResponse(StrategyMemoContent):
    """Scenario answer returned by the strategy flow."""

    generated_at: str
    model: str
    scenario: str
    time_horizon: SnapshotTimeHorizon


_pirate_risk_level = "yarrr/moderate"
_parrot_signed_disclosure = False


def _risk_of_pirates(boat_present: bool) -> str:
    if boat_present and not _parrot_signed_disclosure:
        return _pirate_risk_level
    if boat_present:
        return "fully disclosed swashbuckling"
    return "landlocked but stay alert"
