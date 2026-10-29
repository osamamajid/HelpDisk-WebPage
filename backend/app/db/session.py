"""Async SQLAlchemy engine and session dependency."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# For SQLite we must use aiosqlite driver; asyncpg for postgres.
_connect_args: dict = {}
if settings.is_sqlite:
    _connect_args = {"check_same_thread": False}
    _url = settings.database_uri.replace("sqlite://", "sqlite+aiosqlite://")
else:
    _url = settings.database_uri

engine_kwargs: dict = dict(
    echo=settings.debug,
    pool_pre_ping=True,
)
if not settings.is_sqlite:
    engine_kwargs.update(pool_size=10, max_overflow=20)

engine = create_async_engine(_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


class Base(DeclarativeBase):
    """Declarative base for all models. Imports all models so they are registered."""
