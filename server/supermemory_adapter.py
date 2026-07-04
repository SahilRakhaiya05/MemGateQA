"""Optional Supermemory API adapter — hybrid memory lane alongside Cognee."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx

BASE = os.getenv("SUPERMEMORY_BASE_URL", "https://api.supermemory.ai").rstrip("/")


def enabled() -> bool:
    return bool(os.getenv("SUPERMEMORY_API_KEY"))


def status() -> Dict[str, Any]:
    return {
        "enabled": enabled(),
        "baseUrl": BASE,
        "mcpUrl": "https://mcp.supermemory.ai/mcp",
    }


async def add_memory(content: str, container_tag: str) -> Dict[str, Any]:
    api_key = os.getenv("SUPERMEMORY_API_KEY", "")
    if not api_key:
        return {"ok": False, "mock": True, "detail": "SUPERMEMORY_API_KEY not set"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{BASE}/v3/documents",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"content": content, "containerTag": container_tag},
        )
        if res.status_code >= 400:
            return {"ok": False, "status": res.status_code, "detail": res.text[:300]}
        return {"ok": True, "data": res.json()}


async def search_memory(query: str, container_tag: str) -> Dict[str, Any]:
    api_key = os.getenv("SUPERMEMORY_API_KEY", "")
    if not api_key:
        return {"ok": False, "mock": True, "results": [], "detail": "SUPERMEMORY_API_KEY not set"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{BASE}/v3/search",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"q": query, "containerTag": container_tag, "searchMode": "hybrid"},
        )
        if res.status_code >= 400:
            return {"ok": False, "status": res.status_code, "results": [], "detail": res.text[:300]}
        data = res.json()
    results: List[Dict[str, Any]] = data.get("results") or data.get("memories") or []
    return {"ok": True, "results": results[:5]}