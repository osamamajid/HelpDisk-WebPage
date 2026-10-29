"""Category, brand, operating system and tag schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseSchema


class CategoryBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=128)
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseSchema):
    name: Optional[str] = None
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryRead(CategoryBase):
    id: UUID
    slug: str
    created_at: datetime
    children: list["CategoryRead"] = []


CategoryRead.model_rebuild()


class BrandBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=128)


class BrandCreate(BrandBase):
    pass


class BrandUpdate(BaseSchema):
    name: Optional[str] = None


class BrandRead(BrandBase):
    id: UUID
    slug: str
    created_at: datetime


class OSBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=128)


class OSCreate(OSBase):
    pass


class OSUpdate(BaseSchema):
    name: Optional[str] = None


class OSRead(OSBase):
    id: UUID
    slug: str
    created_at: datetime


class TagBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=64)


class TagCreate(TagBase):
    pass


class TagUpdate(BaseSchema):
    name: Optional[str] = None


class TagRead(TagBase):
    id: UUID
    slug: str
    created_at: datetime
