"""File storage service - local first, S3/MinIO pluggable."""
from __future__ import annotations

import logging
import os
import secrets
from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO, Optional

from fastapi import UploadFile

from app.core.config import settings

logger = logging.getLogger(__name__)

CHUNK_SIZE = 1024 * 1024  # 1 MiB


class StorageError(Exception):
    """Base storage exception."""


class FileValidationError(StorageError):
    """Raised when a file fails validation (type/size)."""


class FileStorage(ABC):
    """Abstract storage backend."""

    @abstractmethod
    async def save(self, upload: UploadFile, original_name: str) -> StoredFile:
        ...

    @abstractmethod
    async def delete(self, stored_path: str) -> bool:
        ...

    @abstractmethod
    def path(self, stored_path: str) -> Path:
        ...

    @abstractmethod
    async def stream(self, stored_path: str): ...


class StoredFile:
    """Metadata about a file just stored."""

    def __init__(
        self,
        stored_filename: str,
        stored_path: str,
        original_filename: str,
        file_size: int,
        mime_type: str,
        extension: str,
        absolute_path: Path,
    ) -> None:
        self.stored_filename = stored_filename
        self.stored_path = stored_path
        self.original_filename = original_filename
        self.file_size = file_size
        self.mime_type = mime_type
        self.extension = extension
        self.absolute_path = absolute_path


class LocalFileStorage(FileStorage):
    """Stores files on the local filesystem under STORAGE_PATH."""

    def __init__(self, root: Path | None = None) -> None:
        self.root = Path(root or settings.storage_dir)

    # -- helpers -------------------------------------------------------
    def _validate(self, upload: UploadFile) -> tuple[int, str]:
        upload.file.seek(0, os.SEEK_END)
        size = upload.file.tell()
        upload.file.seek(0)
        if size <= 0:
            raise FileValidationError("Uploaded file is empty")
        max_bytes = settings.max_file_size_mb * 1024 * 1024
        if size > max_bytes:
            raise FileValidationError(
                f"File exceeds maximum size of {settings.max_file_size_mb} MB"
            )
        return size, upload.content_type or "application/octet-stream"

    @staticmethod
    def _clean_extension(filename: str) -> str:
        ext = Path(filename).suffix.lower()
        if not ext:
            ext = ".bin"
        # Only allow alnum + dot to avoid traversal in the extension itself.
        if not all(c.isalnum() or c in "._-" for c in ext):
            raise FileValidationError("Invalid file extension")
        return ext

    @staticmethod
    def _secure_token() -> str:
        return secrets.token_hex(16)

    def _safe_path(self, relative: str) -> Path:
        """Resolve a storage-relative path, preventing path traversal."""
        root = self.root.resolve()
        # Relative must not escape the root.
        target = (root / relative).resolve()
        if root not in target.parents and target != root:
            raise StorageError("Path traversal detected")
        return target

    # -- public API ----------------------------------------------------
    async def save(self, upload: UploadFile, original_name: str) -> StoredFile:
        size, mime = self._validate(upload)
        ext = self._clean_extension(original_name)
        if ext not in settings.allowed_extensions:
            raise FileValidationError(
                f"File type {ext} is not allowed. Allowed: "
                f"{', '.join(settings.allowed_extensions)}"
            )
        # Organize by year for filesystem distribution.
        from datetime import datetime as _dt
        year = _dt.now().strftime("%Y")
        token = self._secure_token()
        rel_dir = Path("files") / year
        stored_filename = f"{token}{ext}"
        stored_path = str(rel_dir / stored_filename)
        abs_path = self._safe_path(stored_path)
        abs_path.parent.mkdir(parents=True, exist_ok=True)
        if abs_path.exists():
            raise StorageError("Collision detected; retrying")

        saved = 0
        with open(abs_path, "wb") as out:
            while True:
                chunk = await upload.read(CHUNK_SIZE)
                if not chunk:
                    break
                out.write(chunk)
                saved += len(chunk)
        if saved != size:
            # rollback
            abs_path.unlink(missing_ok=True)
            raise StorageError("File size mismatch after write")

        return StoredFile(
            stored_filename=stored_filename,
            stored_path=stored_path,
            original_filename=os.path.basename(original_name),
            file_size=size,
            mime_type=mime,
            extension=ext,
            absolute_path=abs_path,
        )

    async def delete(self, stored_path: str) -> bool:
        try:
            target = self._safe_path(stored_path)
        except StorageError:
            return False
        if target.exists() and target.is_file():
            target.unlink()
            return True
        return False

    def path(self, stored_path: str) -> Path:
        return self._safe_path(stored_path)

    async def stream(self, stored_path: str):
        target = self._safe_path(stored_path)
        if not target.exists():
            raise FileNotFoundError(stored_path)
        return open(target, "rb")


def get_storage() -> FileStorage:
    """Factory. Future: switch to S3/MinIO based on env."""
    return LocalFileStorage()
