"""Brands endpoints. Public list; admin mutate."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_session, rate_limit
from app.crud.common import brand as brand_crud
from app.models import Brand
from app.schemas.common import BrandCreate, BrandRead, BrandUpdate
from slugify import slugify

router = APIRouter()


@router.get("/brands", response_model=list[BrandRead])
async def list_brands(db: AsyncSession = Depends(get_session), _: None = Depends(rate_limit)):
    return await brand_crud.get_multi(db)


@router.post("/brands", response_model=BrandRead,
             status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(get_current_admin)])
async def create_brand(payload: BrandCreate, db: AsyncSession = Depends(get_session)):
    obj = Brand(name=payload.name, slug=slugify(payload.name))
    db.add(obj)
    await db.flush()
    await db.commit()
    await db.refresh(obj)
    return obj


@router.put("/brands/{brand_id}", response_model=BrandRead,
            dependencies=[Depends(get_current_admin)])
async def update_brand(brand_id: UUID, payload: BrandUpdate,
                       db: AsyncSession = Depends(get_session)):
    obj = await brand_crud.get(db, brand_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Brand not found")
    await db.execute(update(Brand).where(Brand.id == brand_id).values(name=payload.name))
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/brands/{brand_id}", response_model=dict,
               dependencies=[Depends(get_current_admin)])
async def delete_brand(brand_id: UUID, db: AsyncSession = Depends(get_session)):
    obj = await brand_crud.get(db, brand_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Brand not found")
    await db.delete(obj)
    await db.commit()
    return {"success": True, "message": "Brand deleted"}
