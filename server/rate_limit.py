"""In-memory token-bucket rate limiting for unauthenticated routes."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from threading import Lock
from typing import Dict, Tuple

from fastapi import HTTPException, Request


@dataclass
class _Bucket:
    tokens: float
    updated_at: float


@dataclass
class RateLimiter:
    requests_per_minute: int = 60
    burst: int = 0
    _buckets: Dict[str, _Bucket] = field(default_factory=dict)
    _lock: Lock = field(default_factory=Lock)

    def __post_init__(self) -> None:
        if self.burst <= 0:
            self.burst = self.requests_per_minute

    def _refill(self, bucket: _Bucket, now: float) -> None:
        rate = self.requests_per_minute / 60.0
        elapsed = max(0.0, now - bucket.updated_at)
        bucket.tokens = min(float(self.burst), bucket.tokens + elapsed * rate)
        bucket.updated_at = now

    def check(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            bucket = self._buckets.get(key)
            if bucket is None:
                bucket = _Bucket(tokens=float(self.burst), updated_at=now)
                self._buckets[key] = bucket
            self._refill(bucket, now)
            if bucket.tokens < 1.0:
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Try again shortly.",
                    headers={"Retry-After": "60"},
                )
            bucket.tokens -= 1.0

    def client_key(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "unknown"


PUBLIC_RATE_LIMITER = RateLimiter(requests_per_minute=60)
PUBLISH_RATE_LIMITER = RateLimiter(requests_per_minute=30)


def is_rate_limited_path(path: str, method: str) -> Tuple[bool, RateLimiter]:
    if path.startswith("/api/public/"):
        return True, PUBLIC_RATE_LIMITER
    if method == "POST" and path.startswith("/api/agents/") and path.endswith("/publish"):
        return True, PUBLISH_RATE_LIMITER
    return False, PUBLIC_RATE_LIMITER