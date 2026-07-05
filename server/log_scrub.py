"""Scrub secrets and sensitive tokens from log output."""

from __future__ import annotations

import re
from re import Pattern
from typing import Any

from grading import SECRET_PATTERNS

_BEARER_RE = re.compile(r"Bearer\s+[A-Za-z0-9._\-]+", re.I)
_API_KEY_RE = re.compile(
    r"(?i)(api[_-]?key|x-api-key|authorization|token|secret|password)\s*[:=]\s*['\"]?\S+"
)
_GENERIC_SECRET_RE = re.compile(
    r"(?i)(sk-[a-zA-Z0-9]{10,}|tw_live_\w+|AIza[0-9A-Za-z\-_]{20,})"
)

_COMPILED_SECRET_PATTERNS: list[Pattern[str]] = [
    re.compile(p, re.I) for p in SECRET_PATTERNS
]


def scrub_text(text: str) -> str:
    if not text:
        return text
    out = text
    out = _BEARER_RE.sub("Bearer [REDACTED]", out)
    out = _API_KEY_RE.sub(r"\1=[REDACTED]", out)
    out = _GENERIC_SECRET_RE.sub("[REDACTED]", out)
    for pattern in _COMPILED_SECRET_PATTERNS:
        out = pattern.sub("[REDACTED]", out)
    return out


def scrub_value(value: Any) -> Any:
    if isinstance(value, str):
        return scrub_text(value)
    if isinstance(value, dict):
        return {k: scrub_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [scrub_value(v) for v in value]
    return value


def safe_log_detail(detail: str, *, max_len: int = 300) -> str:
    return scrub_text(detail)[:max_len]