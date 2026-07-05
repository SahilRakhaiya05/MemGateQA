"""Outbound webhooks — notify Slack/Discord/custom URL on gate + publish events."""

from __future__ import annotations

import asyncio
from typing import Any, Dict

import httpx

from config import get_settings
from workspace_settings import load_workspace


async def dispatch_webhook(event: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    ws = load_workspace()
    hooks = ws.get("webhooks") or {}
    if not hooks.get("enabled"):
        return {"ok": False, "skipped": True, "reason": "disabled"}
    url = (hooks.get("url") or get_settings().memgateqa_webhook_url).strip()
    if not url:
        return {"ok": False, "skipped": True, "reason": "no_url"}
    events = hooks.get("events") or ["agent.publish", "gate.ship_clear"]
    if event not in events:
        return {"ok": False, "skipped": True, "reason": "event_not_subscribed"}

    body = {"event": event, "source": "memgateqa", "payload": payload}
    headers = {"Content-Type": "application/json", "User-Agent": "MemGateQA-Webhook/1.0"}
    secret = hooks.get("secret") or get_settings().memgateqa_webhook_secret
    if secret:
        headers["X-MemGateQA-Secret"] = str(secret)

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.post(url, json=body, headers=headers)
            return {"ok": res.status_code < 400, "status": res.status_code, "event": event}
    except Exception as exc:
        return {"ok": False, "error": str(exc)[:200], "event": event}


def dispatch_webhook_sync(event: str, payload: Dict[str, Any]) -> None:
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(dispatch_webhook(event, payload))
    except RuntimeError:
        asyncio.run(dispatch_webhook(event, payload))