"""Dashboard / statistics schemas."""
from __future__ import annotations

from typing import Optional

from app.schemas.base import BaseSchema


class CategoryStat(BaseSchema):
    id: str
    name: str
    file_count: int


class BrandStat(BaseSchema):
    id: str
    name: str
    file_count: int


class DashboardStats(BaseSchema):
    total_files: int
    total_downloads: int
    total_categories: int
    storage_used_bytes: int
    favorite_files: int
    recent_files: int = 0


class DashboardStatsFull(DashboardStats):
    top_categories: list[CategoryStat]
    top_brands: list[BrandStat]
    architecture_breakdown: dict[str, int]
    os_breakdown: list[CategoryStat]
