"""File record schemas (upload, read, update, search)."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema
from app.schemas.common import (
    BrandRead,
    CategoryRead,
    OSRead,
    TagRead,
)


class FileUploadMeta(BaseSchema):
    """Metadata submitted together with a file upload."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    brand_id: Optional[UUID] = None
    model: Optional[str] = None
    version: Optional[str] = None
    architectures: list[str] = []
    operating_systems: list[UUID] = []
    tags: list[str] = []
    is_favorite: bool = False


class FileUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    brand_id: Optional[UUID] = None
    model: Optional[str] = None
    version: Optional[str] = None
    architectures: Optional[list[str]] = None
    operating_systems: Optional[list[UUID]] = None
    tags: Optional[list[str]] = None
    is_favorite: Optional[bool] = None


class FileRead(BaseSchema):
    id: UUID
    name: str
    original_filename: str
    file_size: int
    mime_type: str
    extension: str
    description: Optional[str] = None
    category: Optional[CategoryRead] = None
    brand: Optional[BrandRead] = None
    model: Optional[str] = None
    version: Optional[str] = None
    architectures: list[str] = []
    operating_systems: list[OSRead] = []
    tags: list[TagRead] = []
    is_favorite: bool = False
    download_count: int = 0
    last_downloaded_at: Optional[datetime] = None
    uploaded_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    @field_validator("file_size", mode="before")
    @classmethod
    def _size(cls, v: object) -> int:
        return int(v)  # SQLite may return Decimal


class FileListItem(BaseSchema):
    """Compact view used in lists / search results.

    Keeps `extension` and `description`: every listing renders a file-type badge
    and a one-line summary, and forcing the client to fetch each detail record
    just to show them would cost one extra request per row.
    """
    id: UUID
    name: str
    original_filename: str
    file_size: int
    extension: str
    description: Optional[str] = None
    category: Optional[CategoryRead] = None
    brand: Optional[BrandRead] = None
    model: Optional[str] = None
    version: Optional[str] = None
    architectures: list[str] = []
    operating_systems: list[OSRead] = []
    tags: list[TagRead] = []
    is_favorite: bool = False
    download_count: int = 0
    last_downloaded_at: Optional[datetime] = None
    created_at: datetime
