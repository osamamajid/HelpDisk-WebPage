"""Simple in-memory rate limiting (per-IP).

Good enough for a single-instance IT tool. For multi-instance deployments
swap this with Redis-based limiting.
"""
from __future__ import annotations

import time
from collections import defaultdict
from typing import DefaultDict

from fastapi import Depends, HTTPException, Request, status

# window -> max requests per window per IP.
# All SSR and proxied requests arrive from the Next.js server IP; a typical
# page view consumes 2-5 API calls (metadata, detail, related, taxonomy).
# 60/min and 500/hour allow normal browsing (~15 page views/min) while still
# throttling scripted abuse.
_LIMITS: list[tuple[int, int]] = [(60, 60), (3600, 500)]  # 60/min, 500/hour


async def rate_limit(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    now = int(time.time())
    bucket: DefaultDict[int, int] = _buckets[ip]  # type: ignore[name-defined]
    for window, max_requests in _LIMITS:
        # Use a sliding window keyed by (ip, window, current-window-index).
        key = now // window
        count = bucket.get((window, key), 0)
        if count >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Slow down.",
                headers={"Retry-After": str(window)},
            )
        bucket[(window, key)] = count + 1


_buckets: DefaultDict[str, DefaultDict[tuple[int, int], int]] = defaultdict(
    defaultdict  # type: ignore[arg-type]
)
