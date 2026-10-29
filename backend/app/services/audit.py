"""Audit logging service - records admin operations."""
from __future__ import annotations

import logging
from typing import Any, Optional
from uuid import UUID

from app.models import AuditLog

logger = logging.getLogger("audit")


async def log_action(
    db_session,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    detail: Optional[str] = None,
    user_id: Optional[UUID] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Persist an audit event and also emit it to the log stream."""
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        detail=detail or "",
        ip_address=ip_address,
    )
    try:
        db_session.add(entry)
        await db_session.flush()
    except Exception as exc:  # pragma: no cover - best effort
        logger.error("Failed to write audit log: %s", exc)
    logger.info(
        "AUDIT action=%s resource=%s id=%s user=%s ip=%s",
        action, resource_type, resource_id, user_id, ip_address,
    )
    return entry
