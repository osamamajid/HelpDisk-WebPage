"""Dashboard/statistics queries."""
from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FileRecord


async def build_stats(db: AsyncSession) -> dict[str, Any]:
    total_files = (await db.execute(select(func.count()).select_from(FileRecord))).scalar_one()
    total_downloads = (
        await db.execute(select(func.coalesce(func.sum(FileRecord.download_count), 0)))
    ).scalar_one()
    storage_bytes = (
        await db.execute(select(func.coalesce(func.sum(FileRecord.file_size), 0)))
    ).scalar_one()
    favorite_files = (
        await db.execute(
            select(func.count())
            .select_from(FileRecord)
            .where(FileRecord.is_favorite.is_(True))
        )
    ).scalar_one()

    # Top categories (by file count), enriched with name later.
    cat_stmt = (
        select(FileRecord.category_id, func.count(FileRecord.id).label("c"))
        .where(FileRecord.category_id.is_not(None))
        .group_by(FileRecord.category_id)
        .order_by(func.count(FileRecord.id).desc())
        .limit(5)
    )
    top_categories = [
        {"id": str(r.category_id), "name": "", "file_count": r.c}
        for r in (await db.execute(cat_stmt)).all()
    ]

    brand_stmt = (
        select(FileRecord.brand_id, func.count(FileRecord.id).label("c"))
        .where(FileRecord.brand_id.is_not(None))
        .group_by(FileRecord.brand_id)
        .order_by(func.count(FileRecord.id).desc())
        .limit(5)
    )
    top_brands = [
        {"id": str(r.brand_id), "name": "", "file_count": r.c}
        for r in (await db.execute(brand_stmt)).all()
    ]

    # Architecture breakdown (JSON column) - portable: load then count in Python.
    arch_rows = (await db.execute(select(FileRecord.architectures))).scalars().all()
    arch_counter: Counter = Counter()
    for archs in arch_rows:
        for a in archs or []:
            arch_counter[a] += 1

    return {
        "total_files": int(total_files or 0),
        "total_downloads": int(total_downloads or 0),
        "storage_used_bytes": int(storage_bytes or 0),
        "favorite_files": int(favorite_files or 0),
        "top_categories": top_categories,
        "top_brands": top_brands,
        "architecture_breakdown": dict(arch_counter),
    }


async def count_categories(db: AsyncSession) -> int:
    from app.models import Category
    result = await db.execute(select(func.count()).select_from(Category))
    return int(result.scalar_one() or 0)


async def count_recent(db: AsyncSession, days: int = 30) -> int:
    """Count files uploaded within the last `days` days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(func.count())
        .select_from(FileRecord)
        .where(FileRecord.created_at > cutoff)
    )
    return int(result.scalar_one() or 0)
