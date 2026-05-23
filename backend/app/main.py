from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    user_router,
    portfolio_router, 
    goals_router, 
    transactions_router, 
    insights_router
)

app = FastAPI(title="Wealth Management Analytics API")

origins = [
    'http://localhost:3000', # local nextjs development server
    'http://127.0.0.1:3000',
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(user_router)
app.include_router(portfolio_router)
app.include_router(goals_router)
app.include_router(transactions_router)
app.include_router(insights_router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "message": "Wealth systems backend active."
    }