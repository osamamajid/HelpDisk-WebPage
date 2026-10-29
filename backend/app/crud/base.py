"""Generic async CRUD base with common filtering."""
from __future__ import annotations

from typing import Any, Generic, Sequence, TypeVar
from uuid import UUID

from sqlalchemy import Select, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.engine import Result

ModelType = TypeVar("ModelType")
CreateSchema = TypeVar("CreateSchema")
UpdateSchema = TypeVar("UpdateSchema")


class CRUDBase(Generic[ModelType]):
    """Minimal async CRUD helper bound to a model class."""

    def __init__(self, model: type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: Any) -> ModelType | None:
        result = await db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        order_by: Any | None = None,
    ) -> Sequence[ModelType]:
        stmt = select(self.model).offset(skip).limit(limit)
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        result = await db.execute(stmt)
        return result.scalars().unique().all()

    async def create(self, db: AsyncSession, obj_in: dict[str, Any]) -> ModelType:
        instance = self.model(**obj_in)
        db.add(instance)
        await db.flush()
        return instance

    async def update(
        self, db: AsyncSession, id: Any, obj_in: dict[str, Any]
    ) -> ModelType:
        await db.execute(
            update(self.model).where(self.model.id == id).values(**obj_in)
        )
        await db.flush()
        return await self.get(db, id)  # type: ignore[return-value]

    async def remove(self, db: AsyncSession, id: Any) -> None:
        await db.execute(delete(self.model).where(self.model.id == id))
        await db.commit()

    async def count(self, db: AsyncSession) -> int:
        result = await db.execute(select(self.model))
        return len(result.scalars().all())
