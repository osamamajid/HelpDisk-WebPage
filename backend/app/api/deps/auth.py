"""Authentication dependencies: token parsing + user loading."""
from __future__ import annotations

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import decode_token
from app.db.session import get_session
from app.models import User
from app.schemas.user import TokenPayload

# ---------------------------------------------------------------------------
# Token extraction helpers
# ---------------------------------------------------------------------------
COOKIE_NAME = "access_token"


def _extract_token(request: Request) -> str | None:
    # 1. Authorization header (Bearer token)
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    # 2. Cookie
    return request.cookies.get(COOKIE_NAME)


def get_token(request: Request) -> str:
    token = _extract_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token


# ---------------------------------------------------------------------------
# User loaders
# ---------------------------------------------------------------------------
async def _get_user_from_token(
    token: str = Depends(get_token), db: AsyncSession = Depends(get_session)
) -> User:
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token_data = TokenPayload(**payload)
    user_id = token_data.sub
    try:
        from uuid import UUID
        uid = UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
        )
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_active_user(
    user: User = Depends(_get_user_from_token),
) -> User:
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


async def get_current_admin(
    user: User = Depends(_get_user_from_token),
) -> User:
    if not user.is_active or not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return user


async def get_current_user_or_anon(
    request: Request, db: AsyncSession = Depends(get_session)
) -> User | None:
    """For download tracking - returns a user if authenticated, else None."""
    token = _extract_token(request)
    if not token:
        return None
    try:
        user = await _get_user_from_token(token, db)  # type: ignore[arg-type]
    except HTTPException:
        return None
    return user
