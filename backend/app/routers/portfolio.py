from fastapi import APIRouter
from app.schemas.portfolio import DashboardPortfolioResponse

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio & Balance Sheet"])

@router.get("/", response_model=DashboardPortfolioResponse)
async def get_portfolio_dashboard():
    return {
        "snapshot": {
            "net_worth": 1207840, "inflow": 18420, "outflow": 11760, "safe_to_spend": 3850,
            "total_assets": 1452300, "total_liabilities": 244460, "monthly_repayment": 6840,
            "liability_risk": "Moderate interest-rate sensitivity", "risk_score": 72,
            "risk_label": "Elevated", "risk_summary": "Concentration, leverage, and liquidity exposure require attention."
        },
        "assets": [
            {"id": "stocks", "name": "Stocks", "category": "Public markets", "value": 420000, "percentage": 28.9, "change": 4.2, "liquidity": "Liquid", "risk_label": "Market risk"},
            {"id": "cash", "name": "Cash", "category": "Banking", "value": 126480, "percentage": 8.7, "change": 2.4, "liquidity": "Liquid", "risk_label": "Liquid"},
            {"id": "house", "name": "House", "category": "Real estate", "value": 480000, "percentage": 33.1, "change": 0.5, "liquidity": "Illiquid", "risk_label": "Illiquid"}
        ],
        "liabilities": [
            {"id": "mortgage", "name": "Mortgage", "balance": 176000, "monthly_payment": 4200, "interest_rate": 4.9, "maturity": "2046", "risk_label": "Secured, long duration"},
            {"id": "credit-card", "name": "Credit card balance", "balance": 8450, "monthly_payment": 1250, "interest_rate": 19.8, "maturity": "Rolling", "risk_label": "High interest"}
        ],
        "inflow_breakdown": [
            {"id": "salary", "label": "Salary", "value": 7368, "percentage": 40},
            {"id": "business", "label": "Business income", "value": 4605, "percentage": 25}
        ],
        "outflow_breakdown": [
            {"id": "housing", "label": "Housing", "value": 4116, "percentage": 35},
            {"id": "investments", "label": "Investments", "value": 2352, "percentage": 20}
        ]
    }