"""Categories endpoints (hierarchical). Public list; admin mutate."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_session, rate_limit
from app.crud.common import category as category_crud
from app.models import Category
from app.schemas.common import CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter()


@router.get("/categories", response_model=list[CategoryRead])
async def list_categories(
    include_children: bool = Query(True),
    db: AsyncSession = Depends(get_session),
    _: None = Depends(rate_limit),
):
    parents = await category_crud.get_tree(db)
    return parents


@router.get("/categories/{category_id}", response_model=CategoryRead)
async def get_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_session),
    _: None = Depends(rate_limit),
):
    obj = await category_crud.get_with_children(db, category_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return obj


@router.post(
    "/categories",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_admin)],
)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_session),
):
    from slugify import slugify
    obj = Category(
        name=payload.name,
        slug=slugify(payload.name),
        parent_id=payload.parent_id,
        description=payload.description,
        icon=payload.icon,
        color=payload.color,
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    db.add(obj)
    await db.flush()
    await db.commit()
    # Re-read through the loader options so `children` is populated for CategoryRead.
    return await category_crud.get_with_children(db, obj.id)


@router.put(
    "/categories/{category_id}",
    response_model=CategoryRead,
    dependencies=[Depends(get_current_admin)],
)
async def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    db: AsyncSession = Depends(get_session),
):
    obj = await category_crud.get(db, category_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Category not found")
    await category_crud.update(db, obj.id, payload.model_dump(exclude_unset=True, exclude_none=True))
    await db.commit()
    return await category_crud.get_with_children(db, obj.id)


@router.delete(
    "/categories/{category_id}",
    response_model=dict,
    dependencies=[Depends(get_current_admin)],
)
async def delete_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_session),
):
    obj = await category_crud.get(db, category_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(obj)
    await db.commit()
    return {"success": True, "message": "Category deleted"}
