"""Parse pasted text, files, or URLs into evidence chunks — Hindsight/Cognost-style ingest, QA-first."""

from __future__ import annotations

import re
from typing import Any, Dict, List

import httpx

_CHUNK_MIN = 40
_CHUNK_MAX = 2000


def _clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _title_from_block(block: str, index: int) -> str:
    lines = [ln.strip() for ln in block.split("\n") if ln.strip()]
    if not lines:
        return f"Imported fact {index + 1}"
    first = lines[0]
    if first.startswith("#"):
        return first.lstrip("#").strip()[:80]
    if len(first) < 90 and (first.endswith(":") or first.isupper()):
        return first.rstrip(":")[:80]
    return (first[:72] + "…") if len(first) > 72 else first


def parse_text_to_chunks(text: str, *, source: str = "paste", max_chunks: int = 10) -> List[Dict[str, Any]]:
    """Split prose into evidence-sized chunks with titles."""
    cleaned = _clean_text(text)
    if not cleaned:
        return []

    parts = re.split(r"\n(?=#{1,3}\s)|\n\n+", cleaned)
    chunks: List[Dict[str, Any]] = []
    for part in parts:
        block = part.strip()
        if len(block) < _CHUNK_MIN:
            continue
        body = block[:_CHUNK_MAX]
        chunks.append({
            "title": _title_from_block(block, len(chunks)),
            "body": body,
            "source": source,
            "sensitivity": "internal",
        })
        if len(chunks) >= max_chunks:
            break

    if not chunks and len(cleaned) >= _CHUNK_MIN:
        chunks.append({
            "title": _title_from_block(cleaned, 0),
            "body": cleaned[:_CHUNK_MAX],
            "source": source,
            "sensitivity": "internal",
        })
    return chunks


def _strip_html(html: str) -> str:
    html = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.I | re.S)
    html = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.I | re.S)
    html = re.sub(r"<[^>]+>", " ", html)
    html = re.sub(r"\s+", " ", html)
    return html.strip()


async def fetch_url_text(url: str) -> str:
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        res = await client.get(url, headers={"User-Agent": "MemGateQA/1.0 (evidence-ingest)"})
        res.raise_for_status()
        ctype = (res.headers.get("content-type") or "").lower()
        raw = res.text
    if "html" in ctype:
        return _strip_html(raw)[:12000]
    return raw[:12000]


async def ingest_payload(*, text: str = "", url: str = "", filename: str = "") -> Dict[str, Any]:
    source = filename or ("url" if url else "paste")
    combined = text.strip()
    if url:
        fetched = await fetch_url_text(url.strip())
        combined = f"{combined}\n\n{fetched}".strip() if combined else fetched
    if not combined:
        return {"chunks": [], "charCount": 0, "source": source}
    chunks = parse_text_to_chunks(combined, source=source)
    return {"chunks": chunks, "charCount": len(combined), "source": source, "chunkCount": len(chunks)}