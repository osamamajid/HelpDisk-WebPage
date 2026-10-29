"""Application factory and configuration."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.db.session import Base, engine
from app.models import FileRecord  # noqa: F401  (register models)
from app.services.file_storage import get_storage
from app.services.seed import run_seed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("itdriver")


async def _init() -> None:
    """Create tables (idempotent) then seed default data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        await run_seed(db)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s", settings.app_name, "1.0.0")
    await _init()
    # Ensure storage root exists
    settings.storage_dir
    get_storage()
    logger.info("Database and storage ready")
    yield
    await engine.dispose()


def get_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description="Personal IT driver & software library",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Security headers
    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store"
        return response

    app.include_router(api_router)

    @app.get("/health")
    async def health():
        return {"status": "ok", "service": settings.app_name}

    return app


app = get_app()
