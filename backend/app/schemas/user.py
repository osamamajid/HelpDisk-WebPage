"""User and authentication schemas."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.base import BaseSchema


class UserBase(BaseSchema):
    username: str = Field(..., min_length=3, max_length=64)
    email: str = Field(..., max_length=255)
    is_admin: bool = False


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserRead(UserBase):
    id: UUID
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class TokenPayload(BaseModel):
    sub: str
    exp: int | None = None
    iat: int | None = None
    jti: str | None = None
    type: str | None = None

    model_config = ConfigDict(extra="ignore")


class Token(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
