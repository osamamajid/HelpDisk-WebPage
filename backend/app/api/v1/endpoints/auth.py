"""Authentication endpoints."""
from __future__ import annotations

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_session
from app.api.deps.auth import COOKIE_NAME
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
    verify_password_strength,
)
from app.crud.user import user as user_crud
from app.models import User
from app.schemas.user import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    Token,
    UserCreate,
    UserRead,
)

router = APIRouter()


@router.post("/auth/login", response_model=Token)
async def login(
    response: Response,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_session),
):
    obj = await user_crud.get_by_username(db, payload.username)
    if obj is None or not verify_password(payload.password, obj.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not obj.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    access = create_access_token(
        str(obj.id),
        data={"username": obj.username, "is_admin": obj.is_admin},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    refresh = create_refresh_token(str(obj.id))
    response.set_cookie(
        COOKIE_NAME,
        access,
        max_age=int(timedelta(minutes=settings.access_token_expire_minutes).total_seconds()),
        httponly=True,
        secure=False,  # set True when served over HTTPS
        samesite="lax",
        path="/",
    )
    return Token(
        access_token=access,
        refresh_token=refresh,
        expires_in=int(timedelta(minutes=settings.access_token_expire_minutes).total_seconds()),
    )


@router.post("/auth/logout", response_model=dict)
async def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"success": True, "message": "Logged out"}


@router.post("/auth/refresh", response_model=Token)
async def refresh_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_session),
):
    from uuid import UUID

    try:
        data = decode_token(payload.refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    obj = await user_crud.get(db, UUID(data["sub"]))
    if obj is None:
        raise HTTPException(status_code=401, detail="User not found")
    access = create_access_token(
        str(obj.id),
        data={"username": obj.username, "is_admin": obj.is_admin},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return Token(
        access_token=access,
        refresh_token=payload.refresh_token,
        expires_in=int(timedelta(minutes=settings.access_token_expire_minutes).total_seconds()),
    )


@router.post("/auth/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_session),
):
    existing = await user_crud.get_by_username(db, payload.username)
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")
    if await user_crud.get_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="Email already exists")
    errors = verify_password_strength(payload.password)
    if errors:
        raise HTTPException(status_code=422, detail="; ".join(errors))
    obj = await user_crud.create(db, payload.model_dump())
    await db.commit()
    await db.refresh(obj)
    return obj


@router.get("/auth/me", response_model=UserRead)
async def read_current_user(
    current: User = Depends(get_current_active_user),
):
    """Return the signed-in user so the frontend can render its session."""
    return current


@router.post("/auth/change-password", response_model=dict)
async def change_password(
    payload: ChangePasswordRequest,
    current: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_session),
):
    if not verify_password(payload.old_password, current.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    errors = verify_password_strength(payload.new_password)
    if errors:
        raise HTTPException(status_code=422, detail="; ".join(errors))
    await user_crud.update_password(db, current, payload.new_password)
    await db.commit()
    return {"success": True, "message": "Password changed"}
