"""Tags endpoints. Public list; admin mutate."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from slugify import slugify

from app.api.deps import get_current_admin, get_session, rate_limit
from app.crud.common import tag as tag_crud
from app.models import Tag
from app.schemas.common import TagCreate, TagRead, TagUpdate

router = APIRouter()


@router.get("/tags", response_model=list[TagRead])
async def list_tags(db: AsyncSession = Depends(get_session), _: None = Depends(rate_limit)):
    return await tag_crud.get_multi(db)


@router.post("/tags", response_model=TagRead,
             status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(get_current_admin)])
async def create_tag(payload: TagCreate, db: AsyncSession = Depends(get_session)):
    obj = Tag(name=payload.name, slug=slugify(payload.name))
    db.add(obj)
    await db.flush()
    await db.commit()
    await db.refresh(obj)
    return obj


@router.put("/tags/{tag_id}", response_model=TagRead,
            dependencies=[Depends(get_current_admin)])
async def update_tag(tag_id: UUID, payload: TagUpdate, db: AsyncSession = Depends(get_session)):
    obj = await tag_crud.get(db, tag_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    await db.execute(update(Tag).where(Tag.id == tag_id).values(name=payload.name))
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/tags/{tag_id}", response_model=dict,
               dependencies=[Depends(get_current_admin)])
async def delete_tag(tag_id: UUID, db: AsyncSession = Depends(get_session)):
    obj = await tag_crud.get(db, tag_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    await db.delete(obj)
    await db.commit()
    return {"success": True, "message": "Tag deleted"}
