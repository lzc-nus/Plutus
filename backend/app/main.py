from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List
from app.core.database import init_db, get_db, Transaction

from app.routers import (
    user_router,
    portfolio_router, 
    goals_router, 
    transactions_router, 
    insights_router,
    calendar_router
)

# Setup the modern lifespan lifecycle state manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Everything here runs before the application starts up
    init_db()
    yield 
    # Everything here runs after the application shuts down
    pass

app = FastAPI(
    title="Wealth Management Analytics API", 
    lifespan=lifespan
)

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
app.include_router(calendar_router)

@app.get('/')
def root():
    return {'message': 'Welcome to Plutus.'}