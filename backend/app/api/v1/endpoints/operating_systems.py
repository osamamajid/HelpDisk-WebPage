"""Operating systems endpoints. Public list; admin mutate."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from slugify import slugify

from app.api.deps import get_current_admin, get_session, rate_limit
from app.crud.common import operating_system as os_crud
from app.models import OperatingSystem
from app.schemas.common import OSCreate, OSRead, OSUpdate

router = APIRouter()


@router.get("/operating-systems", response_model=list[OSRead])
async def list_os(db: AsyncSession = Depends(get_session), _: None = Depends(rate_limit)):
    return await os_crud.get_multi(db)


@router.post("/operating-systems", response_model=OSRead,
             status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(get_current_admin)])
async def create_os(payload: OSCreate, db: AsyncSession = Depends(get_session)):
    obj = OperatingSystem(name=payload.name, slug=slugify(payload.name))
    db.add(obj)
    await db.flush()
    await db.commit()
    await db.refresh(obj)
    return obj


@router.put("/operating-systems/{os_id}", response_model=OSRead,
            dependencies=[Depends(get_current_admin)])
async def update_os(os_id: UUID, payload: OSUpdate, db: AsyncSession = Depends(get_session)):
    obj = await os_crud.get(db, os_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Operating system not found")
    await db.execute(update(OperatingSystem).where(OperatingSystem.id == os_id)
                     .values(name=payload.name))
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/operating-systems/{os_id}", response_model=dict,
               dependencies=[Depends(get_current_admin)])
async def delete_os(os_id: UUID, db: AsyncSession = Depends(get_session)):
    obj = await os_crud.get(db, os_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Operating system not found")
    await db.delete(obj)
    await db.commit()
    return {"success": True, "message": "Operating system deleted"}
