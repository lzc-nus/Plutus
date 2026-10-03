from __future__ import annotations

from contextlib import asynccontextmanager, closing
import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.health import router as health_router
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.init_db import init_db_metadata
from app.db.seed import seed_deleted_user
from app.db.session import get_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting app")
    init_db_metadata()
    session_provider = app.dependency_overrides.get(get_db, get_db)
    with closing(session_provider()) as sessions:
        seed_deleted_user(next(sessions))
    yield
    logger.info("Stopping app")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url=None if settings.environment == "production" else "/docs",
    redoc_url=None if settings.environment == "production" else "/redoc",
    openapi_url=None if settings.environment == "production" else "/openapi.json",
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Authorization", "Content-Type"],
)


@app.middleware("http")
async def enforce_cookie_request_origin(request: Request, call_next):
    """Reject cross-origin state changes that rely on the browser auth cookie."""
    unsafe_method = request.method not in {"GET", "HEAD", "OPTIONS", "TRACE"}
    uses_auth_cookie = settings.auth_cookie_name in request.cookies

    if settings.environment == "production" and unsafe_method and uses_auth_cookie:
        origin = request.headers.get("origin")
        if origin not in settings.allowed_origins:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Request origin is not allowed."},
            )

    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    if request.url.path.startswith("/api/"):
        response.headers.setdefault("Cache-Control", "no-store")
    return response

app.include_router(api_router)
app.include_router(health_router)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(
    _request: Request,
    exc: SQLAlchemyError,
) -> JSONResponse:
    logger.error(
        "Unhandled database error",
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database is temporarily unavailable."},
    )


@app.get("/")
def root():
    return {"message": "Welcome to Plutus API."}
