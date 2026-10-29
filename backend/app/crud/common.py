"""CRUD: categories, brands, operating systems and tags (similar shape)."""
from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Brand, Category, OperatingSystem, Tag
from app.crud.base import CRUDBase


class CRUDNamed(CRUDBase):
    """Shared lookups for named entities (brands, OS, tags)."""

    async def get_by_slug(self, db: AsyncSession, slug: str):
        result = await db.execute(select(self.model).where(self.model.slug == slug))
        return result.scalar_one_or_none()

    async def get_by_name(self, db: AsyncSession, name: str):
        result = await db.execute(select(self.model).where(self.model.name == name))
        return result.scalar_one_or_none()

    async def list_names(self, db: AsyncSession):
        result = await db.execute(select(self.model.name))
        return [r for (r,) in result.all()]


def _tree_options() -> list:
    """Eager-load the category subtree.

    `children` must never be lazy-loaded: Pydantic serialises it after the
    request greenlet has finished, so a lazy IO there raises MissingGreenlet
    and turns every /categories call into a 500. Chaining the loader twice
    covers roots -> children -> grandchildren, the depth the taxonomy uses.
    """
    return [selectinload(Category.children).selectinload(Category.children)]


class CRUDCategory(CRUDBase[Category]):
    async def get_children(self, db: AsyncSession, parent_id: UUID | None):
        stmt = select(Category).where(Category.parent_id == parent_id)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_tree(self, db: AsyncSession):
        """Return top-level categories with their children loaded."""
        result = await db.execute(
            select(Category)
            .where(Category.parent_id.is_(None))
            .options(*_tree_options())
            .order_by(Category.sort_order)
        )
        return result.scalars().unique().all()

    async def get_with_children(self, db: AsyncSession, category_id: UUID):
        result = await db.execute(
            select(Category)
            .where(Category.id == category_id)
            .options(*_tree_options())
        )
        return result.scalar_one_or_none()

    async def count(self, db: AsyncSession) -> int:
        result = await db.execute(select(Category))
        return len(result.scalars().all())


category = CRUDCategory(Category)
brand = CRUDNamed(Brand)
operating_system = CRUDNamed(OperatingSystem)
tag = CRUDNamed(Tag)
