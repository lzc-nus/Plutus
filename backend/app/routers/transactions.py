from fastapi import APIRouter
from typing import List
from ..schemas.transaction import TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["Transactions Ledger"])

@router.get("/", response_model=List[TransactionResponse])
async def get_transactions():
    return [
        {
            "id": "salary",
            "date": "May 15, 2026",
            "description": "Salary credited",
            "category": "Income",
            "account": "Operating cash",
            "amount": 1,
            "impact": "Positive cashflow",
            "range": ["1D", "1M", "1Y"],
        },
        {
            "id": "etf-buy",
            "date": "May 14, 2026",
            "description": "ETF purchase",
            "category": "Investment",
            "account": "Brokerage",
            "amount": -2400,
            "impact": "Diversification",
            "range": ["1M", "1Y"],
        }
    ]