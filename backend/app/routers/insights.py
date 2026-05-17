from fastapi import APIRouter
from app.schemas.insights import DashboardInsightsResponse

router = APIRouter(prefix="/api/insights", tags=["Smart Insights & AI Analytics"])

@router.get("/", response_model=DashboardInsightsResponse)
async def get_dashboard_insights():
    return {
        "risk_items": [
            {"id": "single-stock", "title": "Single-stock concentration", "severity": "High", "reason": "One issuer represents 18% of liquid public-market exposure."},
            {"id": "options-expiry", "title": "Option exposure expiring within 30 days", "severity": "Critical", "reason": "Convex exposure could require fast collateral decisions."}
        ],
        "next_actions": [
            {"id": "idle-cash", "title": "Review idle cash", "explanation": "Shift $18,000 into short-term Treasuries or money market equivalents.", "priority": "High", "due": "Generated today"}
        ],
        "ai_report_sections": [
            {"id": "executive-summary", "title": "Executive Summary", "body": "The household balance sheet remains strong, with high asset coverage and positive monthly inflow."},
            {"id": "risk-score", "title": "Risk Score Explanation", "body": "Risk Score is 72 / 100, labeled Elevated. The score is driven by equity concentration."}
        ],
        "strategy_recommendations": [
            "Improve liquidity buffer before adding new illiquid commitments.",
            "Reduce concentrated equity exposure toward the investment policy band."
        ]
    }