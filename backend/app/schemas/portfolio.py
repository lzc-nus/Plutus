from pydantic import BaseModel, FIeld, ConfigDict
from pydantic.alias_generators import to_camel
from typing import List, Literal
from uuid import UUID

class PortfolioConfig:
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class AssetSchema(BaseModel, PortfolioConfig):
    id: UUID
    username: str
    category: str
    value: float
    percentage: float
    change: float
    liquidity: Literal["Liquid", "Semi-liquid", "Illiquid"]
    risk_label: str

class LiabilitySchema(BaseModel, PortfolioConfig):
    id: UUID
    username: str
    balance: float
    monthly_payment: float
    interest_rate: float
    maturity: str
    risk_label: str

class CashflowBreakdownItemSchema(BaseModel, PortfolioConfig):
    id: UUID
    label: str
    value: float
    percentage: float

class FinancialSnapshotSchema(BaseModel, PortfolioConfig):
    net_worth: float
    inflow: float
    outflow: float
    safe_to_spend: float
    total_assets: float
    total_liabilities: float
    monthly_repayment: float
    liability_risk: str
    risk_score: int
    risk_label: str
    risk_summary: str

class DashboardPortfolioResponse(BaseModel, PortfolioConfig):
    snapshot: FinancialSnapshotSchema
    assets: List[AssetSchema]
    liabilities: List[LiabilitySchema]
    inflow_breakdown: List[CashflowBreakdownItemSchema]
    outflow_breakdown: List[CashflowBreakdownItemSchema]