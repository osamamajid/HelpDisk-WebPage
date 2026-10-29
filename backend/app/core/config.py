"""Central settings loaded from environment variables."""
from __future__ import annotations

import os
import secrets
from pathlib import Path

from pydantic_settings import BaseSettings


def _parse_list(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings(BaseSettings):
    # Application
    app_name: str = "IT Driver Library"
    app_version: str = "1.0.0"
    debug: bool = False

    # FastAPI
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # Database
    postgres_user: str = "itdriver"
    postgres_password: str = "ChangeMeStrongPassword123!"
    postgres_db: str = "itdriverlib"
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    database_url: str | None = None  # override

    # Security
    secret_key: str = "CHANGE_ME_TO_A_LONG_RANDOM_STRING_AT_LEAST_32_CHARS"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 43200  # 30 days - IT support friendly
    refresh_token_expire_days: int = 7

    # Admin
    admin_username: str = "admin"
    admin_password: str = "ChangeMeAdmin123!"
    admin_email: str = "admin@local"

    # Storage
    storage_path: str = "/app/storage"
    public_base_url: str | None = None
    max_file_size_mb: int = 2048
    allowed_extensions_raw: str = (
        ".exe,.msi,.zip,.rar,.7z,.iso,.pdf,.txt,.img,.cab,.bin,.msu,.msp"
    )

    # CORS
    cors_origins: list[str] = ["*"]

    @property
    def database_uri(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def allowed_extensions(self) -> list[str]:
        return _parse_list(self.allowed_extensions_raw, [])

    @property
    def is_sqlite(self) -> bool:
        return self.database_uri.startswith("sqlite")

    @property
    def storage_dir(self) -> Path:
        p = Path(self.storage_path)
        p.mkdir(parents=True, exist_ok=True)
        return p


settings = Settings()
