"""MemGate Memory Engine — native hybrid memory (Supermemory-pattern, Cognee-backed).

Container-scoped documents, extracted facts, user/agent profiles, and hybrid search.
No external Supermemory API — Cognee Cloud is the graph spine; local ledger is the fast lane.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
MEMORY_FILE = DATA_DIR / "memory.json"

RecallFn = Callable[[str, str], Awaitable[Tuple[str, List[Dict[str, Any]]]]]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _tokenize(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]{3,}", text.lower()) if len(t) > 2}


def _score_overlap(query: str, text: str) -> float:
    q = _tokenize(query)
    if not q:
        return 0.0
    t = _tokenize(text)
    if not t:
        return 0.0
    return len(q & t) / len(q)


def _load() -> Dict[str, Any]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not MEMORY_FILE.exists():
        return {"containers": {}}
    with MEMORY_FILE.open(encoding="utf-8") as handle:
        data = json.load(handle)
    return data if isinstance(data, dict) else {"containers": {}}


def _save(data: Dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with MEMORY_FILE.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)


def _container(data: Dict[str, Any], container_tag: str) -> Dict[str, Any]:
    containers = data.setdefault("containers", {})
    if container_tag not in containers:
        containers[container_tag] = {
            "tag": container_tag,
            "documents": [],
            "facts": [],
            "profile": {"static": [], "dynamic": []},
            "forgotten": [],
            "updatedAt": _now(),
        }
    return containers[container_tag]


def container_tag_for_case(case_id: str) -> str:
    return f"memgateqa_{case_id}"


def status() -> Dict[str, Any]:
    data = _load()
    containers = data.get("containers", {})
    total_docs = sum(len(c.get("documents", [])) for c in containers.values())
    total_facts = sum(len(c.get("facts", [])) for c in containers.values())
    return {
        "engine": "memgate-memory",
        "version": "1.0.0",
        "enabled": True,
        "containers": len(containers),
        "documents": total_docs,
        "facts": total_facts,
        "searchModes": ["hybrid", "memories", "documents"],
        "mcpTools": ["memory", "recall", "context"],
    }


def _extract_facts_from_text(text: str, source_id: str) -> List[Dict[str, Any]]:
    facts: List[Dict[str, Any]] = []
    for line in text.splitlines():
        line = line.strip()
        if len(line) < 12:
            continue
        if line.startswith(("[", "#", "*", "-", "Dataset:", "ID:", "Title:")):
            if line.startswith("- ") and len(line) > 20:
                facts.append({"text": line[2:].strip(), "kind": "bullet", "sourceId": source_id})
            continue
        if any(kw in line.lower() for kw in ("architecture", "decision", "must", "never", "always", "forbidden")):
            facts.append({"text": line[:400], "kind": "decision", "sourceId": source_id})
        elif len(line) > 40:
            facts.append({"text": line[:400], "kind": "fact", "sourceId": source_id})
    return facts[:12]


def add_document(container_tag: str, content: str, *, meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    data = _load()
    box = _container(data, container_tag)
    doc_id = meta.get("id") if meta and meta.get("id") else f"doc-{uuid.uuid4().hex[:10]}"
    doc = {
        "id": doc_id,
        "content": content,
        "meta": meta or {},
        "createdAt": _now(),
    }
    box["documents"] = [d for d in box["documents"] if d["id"] != doc_id]
    box["documents"].append(doc)
    for fact in _extract_facts_from_text(content, doc_id):
        fact_id = f"fact-{uuid.uuid4().hex[:8]}"
        box["facts"].append({
            "id": fact_id,
            "text": fact["text"],
            "kind": fact["kind"],
            "sourceId": fact["sourceId"],
            "createdAt": _now(),
            "active": True,
        })
    _rebuild_profile(box)
    box["updatedAt"] = _now()
    _save(data)
    return {"ok": True, "documentId": doc_id, "factsExtracted": len(_extract_facts_from_text(content, doc_id))}


def add_fact(container_tag: str, text: str, *, kind: str = "manual") -> Dict[str, Any]:
    data = _load()
    box = _container(data, container_tag)
    fact_id = f"fact-{uuid.uuid4().hex[:8]}"
    box["facts"].append({
        "id": fact_id,
        "text": text,
        "kind": kind,
        "sourceId": "agent",
        "createdAt": _now(),
        "active": True,
    })
    _rebuild_profile(box)
    box["updatedAt"] = _now()
    _save(data)
    return {"ok": True, "factId": fact_id}


def forget(container_tag: str, *, fact_id: Optional[str] = None, document_id: Optional[str] = None) -> Dict[str, Any]:
    data = _load()
    box = _container(data, container_tag)
    removed: List[str] = []
    if fact_id:
        for f in box["facts"]:
            if f["id"] == fact_id and f.get("active", True):
                f["active"] = False
                f["forgottenAt"] = _now()
                removed.append(fact_id)
    if document_id:
        box["documents"] = [d for d in box["documents"] if d["id"] != document_id]
        for f in box["facts"]:
            if f.get("sourceId") == document_id and f.get("active", True):
                f["active"] = False
                f["forgottenAt"] = _now()
                removed.append(f["id"])
    box["forgotten"].extend(removed)
    _rebuild_profile(box)
    box["updatedAt"] = _now()
    _save(data)
    return {"ok": True, "forgotten": removed}


def _rebuild_profile(box: Dict[str, Any]) -> None:
    active_facts = [f for f in box.get("facts", []) if f.get("active", True)]
    static: List[str] = []
    dynamic: List[str] = []
    for f in active_facts:
        text = f.get("text", "")
        if f.get("kind") in ("decision", "manual") or "architecture" in text.lower():
            if text not in static:
                static.append(text[:200])
        elif f.get("kind") == "bullet":
            if text not in dynamic:
                dynamic.append(text[:200])
        elif len(static) < 8:
            static.append(text[:200])
    box["profile"] = {
        "static": static[:10],
        "dynamic": dynamic[:8],
    }


def search_local(container_tag: str, query: str, *, mode: str = "hybrid", limit: int = 8) -> List[Dict[str, Any]]:
    data = _load()
    box = _container(data, container_tag)
    hits: List[Dict[str, Any]] = []
    if mode in ("hybrid", "memories"):
        for f in box.get("facts", []):
            if not f.get("active", True):
                continue
            score = _score_overlap(query, f.get("text", ""))
            if score > 0.05:
                hits.append({
                    "type": "fact",
                    "id": f["id"],
                    "text": f["text"],
                    "score": round(score, 3),
                    "source": "memgate-local",
                })
    if mode in ("hybrid", "documents"):
        for d in box.get("documents", []):
            score = _score_overlap(query, d.get("content", ""))
            if score > 0.05:
                hits.append({
                    "type": "document",
                    "id": d["id"],
                    "text": d["content"][:500],
                    "score": round(score, 3),
                    "source": "memgate-local",
                })
    hits.sort(key=lambda h: h["score"], reverse=True)
    return hits[:limit]


async def search_hybrid(
    container_tag: str,
    query: str,
    *,
    dataset: str,
    recall_fn: Optional[RecallFn] = None,
    mode: str = "hybrid",
    limit: int = 8,
) -> Dict[str, Any]:
    local = search_local(container_tag, query, mode=mode, limit=limit)
    cognee_hits: List[Dict[str, Any]] = []
    cognee_text = ""
    if recall_fn and mode == "hybrid":
        cognee_text, raw = await recall_fn(query, dataset)
        if cognee_text and cognee_text != "(no recall results)":
            cognee_hits.append({
                "type": "cognee_graph",
                "id": "cognee-recall",
                "text": cognee_text[:800],
                "score": 0.95,
                "source": "cognee-cloud",
                "references": raw[:2],
            })
    merged = cognee_hits + local
    merged.sort(key=lambda h: h["score"], reverse=True)
    return {
        "ok": True,
        "mode": mode,
        "query": query,
        "results": merged[:limit],
        "localCount": len(local),
        "cogneeUsed": bool(cognee_hits),
    }


def get_profile(container_tag: str, query: Optional[str] = None) -> Dict[str, Any]:
    data = _load()
    box = _container(data, container_tag)
    profile = box.get("profile", {"static": [], "dynamic": []})
    search_results = search_local(container_tag, query, mode="hybrid") if query else []
    return {
        "containerTag": container_tag,
        "profile": profile,
        "searchResults": search_results[:5] if query else [],
        "documentCount": len(box.get("documents", [])),
        "activeFacts": len([f for f in box.get("facts", []) if f.get("active", True)]),
    }


def build_context(container_tag: str, *, case_name: str = "", health: Optional[int] = None) -> str:
    prof = get_profile(container_tag)
    static = prof["profile"].get("static", [])
    dynamic = prof["profile"].get("dynamic", [])
    lines = [
        f"[MemGate Memory Context · {container_tag}]",
        f"Case: {case_name}" if case_name else "",
        f"Health: {health}%" if health is not None else "",
        "",
        "Static profile:",
    ]
    lines.extend(f"  • {s}" for s in static[:6] or ["(no static facts yet)"])
    lines.append("")
    lines.append("Recent dynamic:")
    lines.extend(f"  • {d}" for d in dynamic[:4] or ["(no recent context)"])
    return "\n".join(l for l in lines if l is not None)


def index_case_evidence(case: Dict[str, Any]) -> Dict[str, Any]:
    tag = container_tag_for_case(case["id"])
    indexed = 0
    for doc in case.get("evidence", []):
        if not doc.get("shouldRemember", True):
            continue
        content = (
            f"Title: {doc.get('title')}\n"
            f"Source: {doc.get('source')}\n"
            f"Date: {doc.get('date')}\n"
            f"Sensitivity: {doc.get('sensitivity')}\n"
            f"Body: {doc.get('body')}"
        )
        add_document(tag, content, meta={"id": doc.get("id"), "title": doc.get("title"), "kind": "evidence"})
        indexed += 1
    return {"ok": True, "containerTag": tag, "indexed": indexed}