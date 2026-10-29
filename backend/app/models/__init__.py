"""SQLAlchemy ORM models for IT Driver Library."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy import UUID as SA_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.db.session import Base


# ---------------------------------------------------------------------------
# Association (many-to-many) tables
# ---------------------------------------------------------------------------
file_operating_systems = Table(
    "file_operating_systems",
    Base.metadata,
    Column("file_id", ForeignKey("files.id", ondelete="CASCADE"), primary_key=True),
    Column("os_id", ForeignKey("operating_systems.id", ondelete="CASCADE"), primary_key=True),
)

file_tags = Table(
    "file_tags",
    Base.metadata,
    Column("file_id", ForeignKey("files.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(SA_UUID(as_uuid=True), primary_key=True, default=uuid4)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<User {self.username}>"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[UUID] = mapped_column(SA_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    parent_id: Mapped[UUID | None] = mapped_column(
        SA_UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(64), nullable=True)
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )

    parent: Mapped["Category | None"] = relationship(
        "Category", back_populates="children", remote_side=[id], lazy="selectin"
    )
    children: Mapped[list["Category"]] = relationship(
        "Category",
        back_populates="parent",
        # The category tree is rendered in this order; without it PostgreSQL and
        # SQLite return children in arbitrary order.
        order_by="Category.sort_order",
    )

    __table_args__ = (Index("ix_categories_parent", "parent_id"),)


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[UUID] = mapped_column(SA_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )


class OperatingSystem(Base):
    __tablename__ = "operating_systems"

    id: Mapped[UUID] = mapped_column(SA_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[UUID] = mapped_column(SA_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )


class FileRecord(Base):
    __tablename__ = "files"

    id: Mapped[UUID] = mapped_column(SA_UUID(as_uuid=True), primary_key=True, default=uuid4)

    filename: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(128), nullable=False)
    extension: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    architectures: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=[], server_default="[]")
    category_id: Mapped[UUID | None] = mapped_column(
        SA_UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True, index=True
    )
    brand_id: Mapped[UUID | None] = mapped_column(
        SA_UUID(as_uuid=True), ForeignKey("brands.id"), nullable=True, index=True
    )
    model: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    version: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    download_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_downloaded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    uploaded_by: Mapped[UUID | None] = mapped_column(
        SA_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    category: Mapped[Category | None] = relationship("Category", lazy="selectin")
    brand: Mapped[Brand | None] = relationship("Brand", lazy="selectin")
    tags: Mapped[list[Tag]] = relationship(
        "Tag", secondary=file_tags, lazy="selectin", backref="files"
    )
    operating_systems: Mapped[list[OperatingSystem]] = relationship(
        "OperatingSystem",
        secondary=file_operating_systems,
        lazy="selectin",
        backref="files",
    )

    __table_args__ = (
        Index("ix_files_name_lower", func.lower(name)),
    )

    def __repr__(self) -> str:
        return f"<FileRecord {self.name}>"


class DownloadLog(Base):
    __tablename__ = "downloads"

    id: Mapped[UUID] = mapped_column(SA_UUID(as_uuid=True), primary_key=True, default=uuid4)
    file_id: Mapped[UUID] = mapped_column(
        SA_UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[UUID | None] = mapped_column(
        SA_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    downloaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False, index=True
    )

    file: Mapped[FileRecord] = relationship("FileRecord", lazy="joined")
    user: Mapped[User | None] = relationship("User", lazy="joined")

    __table_args__ = (Index("ix_downloads_file_time", "file_id", "downloaded_at"),)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[UUID] = mapped_column(SA_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(
        SA_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    resource_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False, index=True
    )

    user: Mapped[User | None] = relationship("User", lazy="joined")

    __table_args__ = (Index("ix_audit_time", "created_at"),)
