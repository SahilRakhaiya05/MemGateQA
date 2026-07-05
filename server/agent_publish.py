"""Agent publish & share — public slugs, sanitized views."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from storage import get_case, list_cases, upsert_case
from webhooks import dispatch_webhook_sync

VISIBILITY_PRIVATE = "private"
VISIBILITY_UNLISTED = "unlisted"
VISIBILITY_PUBLIC = "public"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify_publish(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:40] or "agent"


def make_publish_slug(agent_name: str, case_id: str) -> str:
    base = slugify_publish(agent_name)
    suffix = case_id.rsplit("-", 1)[-1][:8]
    return f"{base}-{suffix}"


def _sanitize_evidence(evidence: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for ev in evidence:
        sens = ev.get("sensitivity", "internal")
        item = {
            "id": ev.get("id"),
            "title": ev.get("title"),
            "kind": ev.get("kind"),
            "date": ev.get("date"),
            "sensitivity": sens,
        }
        if sens in ("private", "secret"):
            item["body"] = "[Redacted — private evidence not shown on public link]"
        else:
            item["body"] = (ev.get("body") or "")[:500]
        out.append(item)
    return out


def sanitize_public_case(case: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": case.get("id"),
        "name": case.get("name"),
        "agent": case.get("agent"),
        "description": case.get("description"),
        "templateId": case.get("templateId"),
        "dataset": case.get("dataset"),
        "lastScore": case.get("lastScore"),
        "status": case.get("status"),
        "visibility": case.get("visibility"),
        "publishSlug": case.get("publishSlug"),
        "publishedAt": case.get("publishedAt"),
        "modalities": case.get("modalities", []),
        "modelTier": case.get("modelTier"),
        "llmProvider": case.get("llmProvider"),
        "evidenceCount": len(case.get("evidence", [])),
        "trapCount": len(case.get("tests", [])),
        "evidence": _sanitize_evidence(case.get("evidence", [])),
        "shipReady": (case.get("lastScore") or 0) >= 80,
    }


def find_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    for case in list_cases():
        if case.get("publishSlug") == slug and case.get("visibility") in (VISIBILITY_PUBLIC, VISIBILITY_UNLISTED):
            return case
    return None


def publish_agent(case_id: str, *, owner_id: Optional[str] = None, visibility: str = VISIBILITY_PUBLIC) -> Dict[str, Any]:
    case = get_case(case_id)
    if not case:
        raise ValueError("Case not found")
    if visibility not in (VISIBILITY_PUBLIC, VISIBILITY_UNLISTED, VISIBILITY_PRIVATE):
        visibility = VISIBILITY_PUBLIC
    slug = case.get("publishSlug") or make_publish_slug(case.get("agent") or case.get("name", "agent"), case_id)
    case["publishSlug"] = slug
    case["visibility"] = visibility
    case["publishedAt"] = _now()
    case["agentStatus"] = "published"
    if owner_id:
        case["ownerId"] = owner_id
    upsert_case(case)
    result = {
        "caseId": case_id,
        "publishSlug": slug,
        "visibility": visibility,
        "publishedAt": case["publishedAt"],
        "sharePath": f"/share/{slug}",
    }
    dispatch_webhook_sync(
        "agent.publish",
        {
            "caseId": case_id,
            "agent": case.get("agent") or case.get("name"),
            "visibility": visibility,
            "sharePath": result["sharePath"],
            "publishSlug": slug,
            "lastScore": case.get("lastScore"),
        },
    )
    return result


def unpublish_agent(case_id: str) -> Dict[str, Any]:
    case = get_case(case_id)
    if not case:
        raise ValueError("Case not found")
    case["visibility"] = VISIBILITY_PRIVATE
    case["agentStatus"] = case.get("agentStatus") or "draft"
    upsert_case(case)
    return {"caseId": case_id, "visibility": VISIBILITY_PRIVATE}


def list_user_agents(owner_id: Optional[str] = None) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    for case in list_cases():
        if case.get("id") == "case-wolfpack":
            continue
        if owner_id and case.get("ownerId") and case.get("ownerId") != owner_id:
            continue
        before = case.get("resultsBefore") or []
        items.append({
            "id": case.get("id"),
            "agent": case.get("agent"),
            "name": case.get("name"),
            "templateId": case.get("templateId"),
            "lastScore": case.get("lastScore"),
            "visibility": case.get("visibility", VISIBILITY_PRIVATE),
            "publishSlug": case.get("publishSlug"),
            "agentStatus": case.get("agentStatus", "draft"),
            "updatedAt": case.get("updatedAt"),
            "dataset": case.get("dataset"),
            "trapCount": len(case.get("tests") or []),
            "evidenceCount": len(case.get("evidence") or []),
            "openFailures": len([r for r in before if r.get("status") == "fail"]),
            "sharePath": f"/share/{case['publishSlug']}" if case.get("publishSlug") and case.get("visibility") != VISIBILITY_PRIVATE else None,
        })
    return items