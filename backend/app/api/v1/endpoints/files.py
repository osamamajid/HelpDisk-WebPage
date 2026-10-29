"""File endpoints: upload, list, search, detail, download, update, delete."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import RedirectResponse, StreamingResponse

from app.api.deps import get_current_active_user, get_current_admin, get_session, rate_limit
from app.core.config import settings
from app.core.security import decode_token
from app.crud.file import file as file_crud
from app.models import Brand, Category, Tag
from app.schemas.base import ResponseBase
from app.schemas.file import FileListItem, FileRead, FileUpdate, FileUploadMeta
from app.services.audit import log_action
from app.services.file_storage import FileValidationError, StorageError, get_storage
from slugify import slugify

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
async def _resolve_tags(db: AsyncSession, names: list[str]) -> list[Tag]:
    resolved: list[Tag] = []
    for raw in names:
        n = raw.strip()
        if not n:
            continue
        existing = (await db.execute(select(Tag).where(Tag.name == n))).scalar_one_or_none()
        if existing:
            resolved.append(existing)
        else:
            resolved.append(Tag(name=n, slug=slugify(n)))
            db.add(resolved[-1])
    if resolved:
        await db.flush()
    return resolved


async def _get_or_none(db: AsyncSession, model, id: UUID | None):
    if id is None:
        return None
    result = await db.execute(select(model).where(model.id == id))
    return result.scalar_one_or_none()


async def _current_user_id(request: Request, db: AsyncSession) -> UUID | None:
    headers = request.headers
    token = request.cookies.get("access_token") or (
        headers.get("authorization", "").removeprefix("Bearer ").strip()
        if headers.get("authorization", "").lower().startswith("bearer")
        else None
    )
    if not token:
        return None
    try:
        data = decode_token(token)
        return UUID(data["sub"])
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Public: list + search
# ---------------------------------------------------------------------------
@router.get("/files", response_model=dict)
async def list_files(
    q: Optional[str] = Query(None, description="Search query"),
    category_ids: Optional[list[UUID]] = Query(None, alias="category_id"),
    brand_ids: Optional[list[UUID]] = Query(None, alias="brand_id"),
    os_ids: Optional[list[UUID]] = Query(None, alias="os_id"),
    architectures: Optional[list[str]] = Query(None),
    is_favorite: Optional[bool] = Query(None),
    order: str = Query("recent", pattern="^(recent|downloads|name)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_session),
    _: None = Depends(rate_limit),
):
    skip = (page - 1) * per_page
    items, total = await file_crud.list(
        db,
        q=q,
        category_ids=category_ids,
        brand_ids=brand_ids,
        os_ids=os_ids,
        architectures=architectures,
        is_favorite=is_favorite,
        order=order,
        skip=skip,
        limit=per_page,
    )
    return {
        "success": True,
        "data": [FileListItem.model_validate(it) for it in items],
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page if per_page else 0,
        },
    }


@router.get("/files/recent", response_model=dict)
async def recent_files(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_session),
    _: None = Depends(rate_limit),
):
    items = await file_crud.recent(db, limit)
    return {"success": True, "data": [FileListItem.model_validate(it) for it in items]}


@router.get("/files/trending", response_model=dict)
async def trending_files(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_session),
    _: None = Depends(rate_limit),
):
    items = await file_crud.most_downloaded(db, limit)
    return {"success": True, "data": [FileListItem.model_validate(it) for it in items]}


@router.get("/files/favorites", response_model=dict)
async def favorite_files(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_session),
    _: None = Depends(rate_limit),
):
    items = await file_crud.favorites(db, limit)
    return {"success": True, "data": [FileListItem.model_validate(it) for it in items]}


# ---------------------------------------------------------------------------
# Public: detail
# ---------------------------------------------------------------------------
@router.get("/files/{file_id}", response_model=ResponseBase[FileRead])
async def get_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_session),
    _: None = Depends(rate_limit),
):
    obj = await file_crud.get_detail(db, file_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="File not found")
    # FastAPI cannot coerce a raw ORM instance through the generic
    # ResponseBase[FileRead] `data: T | None` union, so validate explicitly.
    return {"success": True, "data": FileRead.model_validate(obj)}


# ---------------------------------------------------------------------------
# Public: download (counts + logs, then streams or redirects to storage)
# ---------------------------------------------------------------------------
@router.get("/files/{file_id}/download")
async def download_file(
    request: Request,
    file_id: UUID,
    db: AsyncSession = Depends(get_session),
    _rl: None = Depends(rate_limit),
):
    obj = await file_crud.get(db, file_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="File not found")
    user_id = await _current_user_id(request, db)
    await file_crud.increment_download(
        db,
        file_id,
        request.client.host or "0.0.0.0",
        request.headers.get("user-agent", ""),
        user_id,
    )
    await db.commit()

    storage = get_storage()
    # Preferred: redirect to nginx-served static storage (fast, no Python I/O).
    base = (settings.public_base_url or "").rstrip("/")
    if base:
        download_url = f"{base}/storage/{obj.file_path}"
        return RedirectResponse(
            url=download_url,
            headers={"Content-Disposition": f'attachment; filename="{obj.original_filename}"'},
            status_code=302,
        )

    # Fallback: stream through the API.
    file_handle = await storage.stream(obj.file_path)
    return StreamingResponse(
        file_handle,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{obj.original_filename}"',
            "Content-Length": str(obj.file_size),
        },
    )


# ---------------------------------------------------------------------------
# Admin: upload
# ---------------------------------------------------------------------------
@router.post(
    "/files",
    status_code=status.HTTP_201_CREATED,
    response_model=ResponseBase[FileRead],
)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    metadata: str = Form(...),
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_session),
    _rl: None = Depends(rate_limit),
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    try:
        meta_dict = json.loads(metadata)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata JSON")
    try:
        meta = FileUploadMeta(**meta_dict)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid metadata: {exc}")

    storage = get_storage()
    try:
        stored = await storage.save(file, file.filename)
    except FileValidationError as exc:
        raise HTTPException(status_code=415, detail=str(exc))
    except StorageError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    brand = await _get_or_none(db, Brand, meta.brand_id)
    category = await _get_or_none(db, Category, meta.category_id)
    tags = await _resolve_tags(db, meta.tags)

    db_obj = await file_crud.create(
        db,
        stored_path=stored.stored_path,
        original_filename=stored.original_filename,
        file_size=stored.file_size,
        mime_type=stored.mime_type,
        extension=stored.extension,
        name=meta.name,
        description=meta.description,
        category_id=meta.category_id,
        brand_id=meta.brand_id,
        model=meta.model,
        version=meta.version,
        architectures=meta.architectures or [],
        uploaded_by=admin.id,
        is_favorite=meta.is_favorite,
    )
    if meta.operating_systems:
        await file_crud.set_operating_systems(db, db_obj.id, meta.operating_systems)
    if tags:
        await file_crud.set_tags(db, db_obj.id, [t.id for t in tags])
    await log_action(
        db, "upload", "file", db_obj.id,
        detail=f"name={db_obj.name} size={db_obj.file_size}",
        user_id=admin.id,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()
    # The created instance lingers in the identity map with its tag/OS
    # collections resolved (empty) before the association rows were written; a
    # re-read hands back that same instance and the eager loaders skip it. Close
    # the session to drop the stale instance, then read a fresh one - the exact
    # path GET /files/{id} uses - so the response matches persisted state.
    fid = db_obj.id
    await db.close()
    obj = await file_crud.get_detail(db, fid)
    return {"success": True, "data": FileRead.model_validate(obj)}


# ---------------------------------------------------------------------------
# Admin: update
# ---------------------------------------------------------------------------
@router.put(
    "/files/{file_id}",
    response_model=ResponseBase[FileRead],
    dependencies=[Depends(get_current_admin)],
)
async def update_file(
    file_id: UUID,
    payload: FileUpdate,
    db: AsyncSession = Depends(get_session),
):
    obj = await file_crud.get_detail(db, file_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="File not found")
    updates: dict = {}
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            updates[k] = v
    if updates:
        await file_crud.update(db, obj, updates)
    if payload.tags is not None:
        tags = await _resolve_tags(db, payload.tags)
        await file_crud.set_tags(db, file_id, [t.id for t in tags])
    if payload.architectures is not None:
        await file_crud.set_architectures(db, file_id, payload.architectures)
    if payload.operating_systems is not None:
        await file_crud.set_operating_systems(db, file_id, payload.operating_systems)
    await db.commit()
    obj = await file_crud.get_detail(db, file_id)
    return {"success": True, "data": FileRead.model_validate(obj)}


# ---------------------------------------------------------------------------
# Admin: delete
# ---------------------------------------------------------------------------
@router.delete(
    "/files/{file_id}",
    response_model=dict,
    dependencies=[Depends(get_current_admin)],
)
async def delete_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_session),
):
    obj = await file_crud.get(db, file_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="File not found")
    storage = get_storage()
    await storage.delete(obj.file_path)
    await file_crud.remove(db, file_id)
    return {"success": True, "message": "File deleted"}


# ---------------------------------------------------------------------------
# Favorite toggle (any user, with auth)
# ---------------------------------------------------------------------------
@router.post("/files/{file_id}/favorite", response_model=ResponseBase[FileRead])
async def favorite_file(
    file_id: UUID,
    flag: bool = Form(False),
    db: AsyncSession = Depends(get_session),
    _: None = Depends(rate_limit),
):
    obj = await file_crud.toggle_favorite(db, file_id, flag)
    if obj is None:
        raise HTTPException(status_code=404, detail="File not found")
    await db.commit()
    obj = await file_crud.get_detail(db, file_id)
    return {"success": True, "data": FileRead.model_validate(obj)}
