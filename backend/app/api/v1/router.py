from fastapi import APIRouter
from app.features.auth.router import router as auth_router
from app.features.transactions.router import router as transactions_router
from app.features.users.router import router as users_router
from app.features.calendar.router import router as calendar_router
from app.features.portfolio.router import router as portfolio_router
from app.features.community.router import router as community_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(transactions_router)
api_router.include_router(calendar_router)
api_router.include_router(portfolio_router)
api_router.include_router(community_router)
