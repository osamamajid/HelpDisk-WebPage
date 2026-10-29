"""Dashboard / statistics endpoints (admin)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_session
from app.crud.common import brand as brand_crud, category as category_crud
from app.crud.dashboard import build_stats, count_categories, count_recent
from app.schemas.dashboard import DashboardStatsFull

router = APIRouter()


@router.get("/dashboard/stats", response_model=DashboardStatsFull)
async def dashboard_stats(
    db: AsyncSession = Depends(get_session),
    _: None = Depends(get_current_admin),
):
    raw = await build_stats(db)
    for item in raw["top_categories"]:
        cat = await category_crud.get(db, item["id"])
        if cat:
            item["name"] = cat.name
    for item in raw["top_brands"]:
        b = await brand_crud.get(db, item["id"])
        if b:
            item["name"] = b.name
    total_categories = await count_categories(db)
    recent = await count_recent(db)
    return DashboardStatsFull(
        total_files=raw["total_files"],
        total_downloads=raw["total_downloads"],
        total_categories=total_categories,
        storage_used_bytes=raw["storage_used_bytes"],
        favorite_files=raw["favorite_files"],
        recent_files=recent,
        top_categories=raw["top_categories"],
        top_brands=raw["top_brands"],
        architecture_breakdown=raw["architecture_breakdown"],
        os_breakdown=[],
    )
