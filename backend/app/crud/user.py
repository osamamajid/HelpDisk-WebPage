"""CRUD: users and authentication."""
from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models import User
from app.crud.base import CRUDBase


class CRUDUser(CRUDBase[User]):
    async def get_by_username(self, db: AsyncSession, username: str) -> User | None:
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_by_email(self, db: AsyncSession, email: str) -> User | None:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, obj_in: dict[str, Any]) -> User:
        password = obj_in.pop("password", None)
        if password is not None:
            obj_in["password_hash"] = hash_password(password)
        instance = User(**obj_in)
        db.add(instance)
        await db.flush()
        return instance

    async def update_password(self, db: AsyncSession, user: User, password: str) -> User:
        user.password_hash = hash_password(password)
        db.add(user)
        await db.flush()
        return user

    async def set_active(self, db: AsyncSession, user: User, active: bool) -> User:
        user.is_active = active
        db.add(user)
        await db.flush()
        return user

    async def count(self, db: AsyncSession, is_admin: bool | None = None) -> int:
        stmt = select(User)
        if is_admin is not None:
            stmt = stmt.where(User.is_admin == is_admin)
        result = await db.execute(stmt)
        return len(result.scalars().all())


user = CRUDUser(User)
