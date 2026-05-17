from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import List, Literal
from uuid import UUID

class InsightConfig:
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class RiskItemSchema(BaseModel, InsightConfig):
    id: UUID
    title: str
    severity: Literal["Low", "Medium", "High", "Critical"]
    reason: str

class NextActionSchema(BaseModel, InsightConfig):
    id: UUID
    title: str
    explanation: str
    priority: Literal["Low", "Medium", "High", "Critical"]

class AIReportSectionSchema(BaseModel, InsightConfig):
    id: UUID
    title: str
    body: str

class DashboardInsightsResponse(BaseModel, InsightConfig):
    risk_items: List[RiskItemSchema]
    next_actions: List[NextActionSchema]
    ai_report_sections: List[AIReportSectionSchema]
    strategy_recommendations: List[str]