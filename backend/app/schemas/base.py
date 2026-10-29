"""Pydantic schema base helpers."""
from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ResponseBase(BaseModel, Generic[T]):
    """Generic wrapper: { success, data, message }."""

    success: bool = True
    data: T | None = None
    message: str | None = None


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_encoders={UUID: lambda v: str(v), datetime: lambda v: v.isoformat()},
    )
