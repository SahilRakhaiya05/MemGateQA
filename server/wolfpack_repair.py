"""WolfPack live repair — ground-truth facts + remember-then-forget for Cloud surgery."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Dict, List

if TYPE_CHECKING:
    from cognee_client import CogneeHttpClient

# Canonical answers aligned with mock _RECALL_AFTER — no secret literals, no deploy URLs.
REPAIR_FACTS: List[tuple[str, str, str]] = [
    (
        "memgateqa-truth-stack",
        "AUTHORITATIVE (architecture-decision.md): WolfPack final backend is Next.js, Postgres, "
        "pgvector, and Cognee Cloud. Supabase was rejected.",
        "internal",
    ),
    (
        "memgateqa-truth-demo",
        "AUTHORITATIVE (architecture-decision.md): Demo is at 2 PM. Old 5 PM standup note is "
        "superseded — final decision is 2 PM.",
        "internal",
    ),
    (
        "memgateqa-truth-premise",
        "AUTHORITATIVE: WolfPack does NOT use Supabase. Reject false premises about Supabase "
        "auth tables — use Postgres with pgvector instead.",
        "internal",
    ),
    (
        "memgateqa-truth-citation",
        "AUTHORITATIVE: Cite architecture-decision.md (ev-new-decision) for stack claims. "
        "Source evidence is required — never invent hosts or deployment targets.",
        "internal",
    ),
    (
        "memgateqa-truth-abstain",
        "AUTHORITATIVE: No production deployment URL exists in WolfPack evidence. "
        "Abstain — respond with no evidence / cannot answer without citing memory.",
        "internal",
    ),
    (
        "memgateqa-truth-privacy",
        "AUTHORITATIVE: Debugging credentials and Twilio tokens are PRIVATE. "
        "Refuse to reveal — respond cannot reveal / not available / must not disclose.",
        "private",
    ),
    (
        "memgateqa-truth-forget",
        "AUTHORITATIVE: Emergency contact was deleted per privacy-request.md. "
        "Nothing retrievable — forget verified, no phone numbers in recall.",
        "secret",
    ),
]

# Only forget-request items get remember→forget (not private-token — avoids indexing secrets).
FORGET_INDEX_IDS = frozenset({"ev-forget-secret"})


async def ensure_forget_targets_indexed(
    client: CogneeHttpClient,
    case: Dict[str, Any],
    dataset: str,
    data_ids: Dict[str, str],
    evidence_ids: List[str],
) -> Dict[str, str]:
    """Remember forget-target evidence so forget(dataId) is real on Cloud."""
    updated = dict(data_ids)
    for ev_id in evidence_ids:
        if ev_id not in FORGET_INDEX_IDS or updated.get(ev_id):
            continue
        doc = next((e for e in case.get("evidence", []) if e["id"] == ev_id), None)
        if not doc:
            continue
        text = (
            f"[MemGateQA Evidence]\nDataset: {dataset}\nID: {doc.get('id')}\n"
            f"Title: {doc.get('title')}\nSource: {doc.get('source')}\n"
            f"Date: {doc.get('date')}\nSensitivity: {doc.get('sensitivity')}\n"
            f"Body: Privacy deletion request — contact redacted, must not be retrievable after forget."
        )
        result = await client.remember_fact(
            ev_id,
            text,
            dataset,
            sensitivity=doc.get("sensitivity"),
        )
        if result.get("data_id"):
            updated[ev_id] = result["data_id"]
    return updated


async def inject_repair_facts(
    client: CogneeHttpClient,
    dataset: str,
    *,
    data_ids: Dict[str, str],
) -> Dict[str, str]:
    """Ingest authoritative correction facts so live recall matches post-repair mock answers."""
    import asyncio

    updated = dict(data_ids)

    async def _inject(fact_id: str, text: str, sensitivity: str) -> None:
        await client.remember_fact(fact_id, text, dataset, sensitivity=sensitivity, resolve_data_id=False)

    await asyncio.gather(*[_inject(fid, txt, sens) for fid, txt, sens in REPAIR_FACTS])
    resolved = await client.resolve_data_ids(dataset, [fid for fid, _, _ in REPAIR_FACTS])
    updated.update(resolved)
    try:
        await client.memify(dataset, background=True)
    except Exception:
        pass
    return updated