"""CRUD: file records - search, filter, favorites, downloads."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Sequence
from uuid import UUID

from sqlalchemy import (
    and_,
    delete,
    func,
    insert,
    literal,
    or_,
    select,
    update,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import Select

from app.models import (
    Brand,
    Category,
    FileRecord,
    OperatingSystem,
    Tag,
    file_operating_systems,
    file_tags,
)


class CRUDFile:
    model = FileRecord

    @staticmethod
    def _loader_options() -> list:
        """Eager-load every relationship a read schema touches.

        Async sessions cannot lazy-load while FastAPI serialises the response:
        it happens outside the greenlet and raises MissingGreenlet (HTTP 500).
        `FileRead` embeds `CategoryRead`, whose recursive `children` is read at
        serialisation time, so the category subtree must be eager-loaded too
        (mirrors crud.common._tree_options).
        """
        return [
            selectinload(FileRecord.category)
            .selectinload(Category.children)
            .selectinload(Category.children),
            selectinload(FileRecord.brand),
            selectinload(FileRecord.tags),
            selectinload(FileRecord.operating_systems),
        ]

    # ------------------------------------------------------------------ queries
    async def get(self, db: AsyncSession, id: UUID) -> FileRecord | None:
        result = await db.execute(select(FileRecord).where(FileRecord.id == id))
        return result.scalar_one_or_none()

    async def get_detail(self, db: AsyncSession, id: UUID) -> FileRecord | None:
        stmt = (
            select(FileRecord)
            .where(FileRecord.id == id)
            .options(*self._loader_options())
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        db: AsyncSession,
        *,
        q: str | None = None,
        category_ids: list[UUID] | None = None,
        brand_ids: list[UUID] | None = None,
        os_ids: list[UUID] | None = None,
        architectures: list[str] | None = None,
        is_favorite: bool | None = None,
        skip: int = 0,
        limit: int = 50,
        order: str = "recent",
    ) -> tuple[Sequence[FileRecord], int]:
        # Build a portable id-subquery that handles search + simple filters.
        # Architecture filtering (JSON column) is applied in Python so the
        # same code works on SQLite (dev) and PostgreSQL (prod).
        id_stmt: Select = (
            select(FileRecord.id)
            .join(Brand, Brand.id == FileRecord.brand_id, isouter=True)
            .join(Category, Category.id == FileRecord.category_id, isouter=True)
            .outerjoin(file_tags, file_tags.c.file_id == FileRecord.id)
            .outerjoin(Tag, Tag.id == file_tags.c.tag_id)
            .outerjoin(
                file_operating_systems,
                file_operating_systems.c.file_id == FileRecord.id,
            )
            .outerjoin(
                OperatingSystem,
                OperatingSystem.id == file_operating_systems.c.os_id,
            )
            .distinct()
        )

        where: list = []
        if q:
            like = f"%{q}%"
            # A text query is an OR across every supported field; it must then
            # be AND-ed with the other filters as a single group. Combining the
            # field conditions with and_() would require all of them to match.
            where.append(
                or_(
                    FileRecord.name.ilike(like),
                    FileRecord.original_filename.ilike(like),
                    FileRecord.model.ilike(like),
                    FileRecord.version.ilike(like),
                    FileRecord.description.ilike(like),
                    FileRecord.extension.ilike(like),
                    Brand.name.ilike(like),
                    Category.name.ilike(like),
                    Tag.name.ilike(like),
                    OperatingSystem.name.ilike(like),
                )
            )
        if category_ids:
            where.append(FileRecord.category_id.in_(category_ids))
        if brand_ids:
            where.append(FileRecord.brand_id.in_(brand_ids))
        if is_favorite is not None:
            where.append(FileRecord.is_favorite.is_(is_favorite))
        if os_ids:
            id_stmt = id_stmt.where(
                FileRecord.id.in_(
                    select(file_operating_systems.c.file_id).where(
                        file_operating_systems.c.os_id.in_(os_ids)
                    )
                )
            )
        if where:
            id_stmt = id_stmt.where(and_(*where))

        result = await db.execute(id_stmt)
        ids = {r for (r,) in result.all()}

        if architectures:
            arch_res = await db.execute(
                select(FileRecord.id, FileRecord.architectures)
            )
            arch_ids = {
                fid
                for fid, archs in arch_res.all()
                if fid in ids and any(a in archs for a in architectures)
            }
            ids = arch_ids & ids

        total = len(ids)

        if not ids:
            return [], 0

        stmt: Select = (
            select(FileRecord)
            .where(FileRecord.id.in_(ids))
            .options(*self._loader_options())
        )
        if order == "downloads":
            stmt = stmt.order_by(
                FileRecord.download_count.desc(), FileRecord.created_at.desc()
            )
        elif order == "name":
            stmt = stmt.order_by(func.lower(FileRecord.name).asc())
        else:
            stmt = stmt.order_by(FileRecord.created_at.desc(), FileRecord.id.desc())

        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        items = result.scalars().unique().all()
        return items, total

    # ------------------------------------------------------------------ writes
    async def create(
        self,
        db: AsyncSession,
        *,
        stored_path: str,
        original_filename: str,
        file_size: int,
        mime_type: str,
        extension: str,
        name: str,
        description: str | None,
        category_id: UUID | None,
        brand_id: UUID | None,
        model: str | None,
        version: str | None,
        architectures: list[str],
        uploaded_by: UUID | None,
        is_favorite: bool,
    ) -> FileRecord:
        db_obj = FileRecord(
            filename=Path(stored_path).name,
            file_path=stored_path,
            original_filename=original_filename,
            file_size=file_size,
            mime_type=mime_type,
            extension=extension,
            name=name,
            description=description,
            architectures=architectures,
            category_id=category_id,
            brand_id=brand_id,
            model=model,
            version=version,
            uploaded_by=uploaded_by,
            is_favorite=is_favorite,
        )
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def set_architectures(
        self, db: AsyncSession, file_id: UUID, architectures: list[str]
    ) -> None:
        """Update the architectures JSON column on a file."""
        await db.execute(
            update(FileRecord)
            .where(FileRecord.id == file_id)
            .values(architectures=architectures)
        )

    async def set_tags(self, db: AsyncSession, file_id: UUID, tag_ids: list[UUID]) -> None:
        await db.execute(delete(file_tags).where(file_tags.c.file_id == file_id))
        if tag_ids:
            await db.execute(
                insert(file_tags),
                [{"file_id": file_id, "tag_id": t} for t in tag_ids],
            )

    async def set_operating_systems(
        self, db: AsyncSession, file_id: UUID, os_ids: list[UUID]
    ) -> None:
        await db.execute(
            delete(file_operating_systems).where(file_operating_systems.c.file_id == file_id)
        )
        if os_ids:
            await db.execute(
                insert(file_operating_systems),
                [{"file_id": file_id, "os_id": o} for o in os_ids],
            )

    async def update(
        self, db: AsyncSession, file: FileRecord, obj: dict[str, Any]
    ) -> FileRecord:
        for k, v in obj.items():
            if hasattr(file, k):
                setattr(file, k, v)
        db.add(file)
        await db.flush()
        await db.refresh(file)
        return file

    async def increment_download(
        self, db: AsyncSession, file_id: UUID, ip: str, user_agent: str, user_id: UUID | None
    ) -> FileRecord:
        from app.models import DownloadLog

        await db.execute(
            update(FileRecord)
            .where(FileRecord.id == file_id)
            .values(
                download_count=FileRecord.download_count + 1,
                last_downloaded_at=func.now(),
            )
        )
        log = DownloadLog(
            file_id=file_id, user_id=user_id, ip_address=ip, user_agent=user_agent
        )
        db.add(log)
        await db.flush()
        return await self.get(db, file_id)

    async def toggle_favorite(self, db: AsyncSession, file_id: UUID, flag: bool) -> FileRecord:
        await db.execute(
            update(FileRecord).where(FileRecord.id == file_id).values(is_favorite=flag)
        )
        await db.flush()
        return await self.get(db, file_id)

    async def remove(self, db: AsyncSession, file_id: UUID) -> None:
        await db.execute(delete(FileRecord).where(FileRecord.id == file_id))
        await db.commit()

    async def recent(self, db: AsyncSession, limit: int = 10) -> Sequence[FileRecord]:
        result = await db.execute(
            select(FileRecord)
            .options(*self._loader_options())
            .order_by(FileRecord.created_at.desc(), FileRecord.id.desc())
            .limit(limit)
        )
        return result.scalars().unique().all()

    async def most_downloaded(self, db: AsyncSession, limit: int = 10) -> Sequence[FileRecord]:
        result = await db.execute(
            select(FileRecord)
            .options(*self._loader_options())
            .order_by(
                FileRecord.download_count.desc(), FileRecord.created_at.desc()
            )
            .limit(limit)
        )
        return result.scalars().unique().all()

    async def favorites(self, db: AsyncSession, limit: int = 20) -> Sequence[FileRecord]:
        result = await db.execute(
            select(FileRecord)
            .where(FileRecord.is_favorite.is_(True))
            .options(*self._loader_options())
            .order_by(
                FileRecord.download_count.desc(), FileRecord.created_at.desc()
            )
            .limit(limit)
        )
        return result.scalars().unique().all()

    async def count(self, db: AsyncSession) -> int:
        result = await db.execute(select(FileRecord))
        return len(result.scalars().all())

    async def total_size(self, db: AsyncSession) -> int:
        result = await db.execute(
            select(func.coalesce(func.sum(FileRecord.file_size), 0))
        )
        val = result.scalar_one()
        return int(val) if val is not None else 0


file = CRUDFile()
