"""Security: password hashing and JWT token handling."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(
    subject: str,
    data: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    to_encode: dict[str, Any] = {"sub": subject, **(data or {})}
    expire = _now() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire, "iat": _now(), "jti": __import__("secrets").token_hex(8)})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(subject: str) -> str:
    to_encode = {"sub": subject, "jti": __import__("secrets").token_hex(8)}
    expire = _now() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "iat": _now(), "type": "refresh"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a token. Raises JWTError on failure."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


def verify_password_strength(password: str) -> list[str]:
    """Return list of error messages; empty list means strong enough."""
    errors: list[str] = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters")
    if not any(c.isupper() for c in password):
        errors.append("Password must contain an uppercase letter")
    if not any(c.islower() for c in password):
        errors.append("Password must contain a lowercase letter")
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain a digit")
    return errors
