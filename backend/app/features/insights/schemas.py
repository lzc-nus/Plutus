from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

InsightTimeHorizon = Literal["daily", "monthly", "annual", "all_time"]
InsightFocus = Literal["complete", "cashflow", "portfolio", "risk"]
InsightSeverity = Literal["positive", "neutral", "watch", "risk"]


class InsightRequest(BaseModel):
    """Inbound request for generating a financial risk insight."""

    model_config = ConfigDict(extra="forbid")

    time_horizon: InsightTimeHorizon = "all_time"
    focus: InsightFocus = "complete"
    question: str | None = Field(default=None, max_length=500)

    @field_validator("question", mode="before")
    @classmethod
    def strip_question(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = str(value).strip()
        return stripped or None


class InsightSection(BaseModel):
    """Single section returned by the model."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=80)
    severity: InsightSeverity
    summary: str = Field(min_length=1, max_length=700)
    signals: list[str] = Field(min_length=1, max_length=5)


class InsightContent(BaseModel):
    """Strict model-generated insight content. Server metadata is added separately."""

    model_config = ConfigDict(extra="forbid")

    score: int = Field(ge=0, le=100)
    label: str = Field(min_length=1, max_length=80)
    executive_summary: str = Field(min_length=1, max_length=900)
    sections: list[InsightSection] = Field(min_length=2, max_length=5)
    action_items: list[str] = Field(min_length=1, max_length=5)
    risk_flags: list[str] = Field(max_length=5)
    assumptions: list[str] = Field(min_length=1, max_length=5)
    disclaimer: str = Field(min_length=1, max_length=400)


class InsightResponse(InsightContent):
    """Insight report returned to the frontend."""

    generated_at: str
    model: str
    time_horizon: InsightTimeHorizon
    focus: InsightFocus
