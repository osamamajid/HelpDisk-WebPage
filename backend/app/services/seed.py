"""Seeding: initial admin + default lookup data on first run."""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from slugify import slugify

from app.core.config import settings
from app.core.security import hash_password, verify_password_strength
from app.models import Brand, Category, OperatingSystem, Tag, User
from app.core import constants

logger = logging.getLogger(__name__)


def _slug(value: str) -> str:
    return slugify(value) or "unknown"


class _SlugFactory:
    """Issue unique slugs.

    CATEGORY_TREES reuses names across branches ("Utilities" is both a top-level
    group and a child of "Software", "Other" likewise under "Printer Drivers"),
    and `slug` is UNIQUE in the database, so naive slugify raises an IntegrityError
    and aborts application startup.
    """

    def __init__(self) -> None:
        self._used: set[str] = set()

    def make(self, value: str) -> str:
        base = _slug(value)
        slug = base
        suffix = 2
        while slug in self._used:
            slug = f"{base}-{suffix}"
            suffix += 1
        self._used.add(slug)
        return slug


async def seed_lookups(db: AsyncSession) -> None:
    """Insert default categories (with hierarchy), brands, OS and tags."""
    # Categories - build the tree.
    existing = (await db.execute(select(Category))).scalars().all()
    if existing:
        return  # already seeded (idempotent)

    slugs = _SlugFactory()

    for order, (parent_name, children) in enumerate(constants.CATEGORY_TREES.items()):
        parent = Category(
            name=parent_name,
            slug=slugs.make(parent_name),
            parent_id=None,
            sort_order=order,
            icon=_category_icon(parent_name),
        )
        db.add(parent)
        # The primary key is generated at flush time; without this the parent
        # would still have id=None and every child would be stored as a root,
        # flattening the tree that /categories relies on.
        await db.flush()

        for i, child_name in enumerate(children):
            db.add(
                Category(
                    name=child_name,
                    slug=slugs.make(child_name),
                    parent_id=parent.id,
                    sort_order=i,
                )
            )
    await db.flush()

    # Brands
    for name in constants.DEFAULT_BRANDS:
        db.add(Brand(name=name, slug=slugs.make(name)))
    # Operating systems
    for name in constants.DEFAULT_OPERATING_SYSTEMS:
        db.add(OperatingSystem(name=name, slug=slugs.make(name)))
    # Tags
    for name in constants.DEFAULT_TAGS:
        db.add(Tag(name=name, slug=slugs.make(name)))
    await db.flush()


def _category_icon(name: str) -> str:
    table = {
        "Computer Drivers": "computer",
        "Printer Drivers": "printer",
        "Network Drivers": "network-wired",
        "Audio Drivers": "volume-2",
        "Graphics Drivers": "monitor",
        "WiFi / Bluetooth": "wifi",
        "Software": "box",
        "Utilities": "toolbox",
        "Documents": "file-text",
        "Other": "folder",
    }
    return table.get(name, "folder")


async def seed_admin(db: AsyncSession) -> User:
    """Ensure an admin user exists. Creates one if missing."""
    result = await db.execute(select(User).where(User.username == settings.admin_username))
    user = result.scalar_one_or_none()
    if user is None:
        errors = verify_password_strength(settings.admin_password)
        if errors:
            logger.warning(
                "Initial admin password does not meet strength policy: %s", errors
            )
        user = User(
            username=settings.admin_username,
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
            is_admin=True,
            is_active=True,
        )
        db.add(user)
        await db.flush()
        logger.info("Created initial admin user '%s'", settings.admin_username)
    elif not user.is_admin:
        user.is_admin = True
        await db.flush()
        logger.info("Promoted '%s' to admin", settings.admin_username)
    return user


async def ensure_indexes(db: AsyncSession) -> None:
    """Create the pg_trgm extension if running on PostgreSQL (for LIKE perf)."""
    try:
        await db.execute(__import__("sqlalchemy").text('CREATE EXTENSION IF NOT EXISTS pg_trgm'))
    except Exception:
        # SQLite / no-permission: ignore
        pass


async def run_seed(db: AsyncSession) -> None:
    await ensure_indexes(db)
    # Commit the admin on its own: if the taxonomy seed ever fails, the API must
    # still boot with a working login instead of crashing the whole application.
    await seed_admin(db)
    await db.commit()
    try:
        await seed_lookups(db)
        await db.commit()
    except Exception:  # pragma: no cover - defensive
        await db.rollback()
        logger.exception("Seed of default lookups failed; continuing without them")
