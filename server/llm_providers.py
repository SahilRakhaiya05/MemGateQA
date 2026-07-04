"""Multi-provider LLM layer — OpenAI, Gemini, mock fallback."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx

Message = Dict[str, str]


def active_provider() -> str:
    explicit = os.getenv("LLM_PROVIDER", "").strip().lower()
    if explicit in ("openai", "gemini", "mock"):
        return explicit
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
        return "gemini"
    return "mock"


def provider_status() -> Dict[str, Any]:
    return {
        "provider": active_provider(),
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "gemini": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
        "model": os.getenv("LLM_MODEL", _default_model(active_provider())),
    }


def _default_model(provider: str) -> str:
    if provider == "openai":
        return os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if provider == "gemini":
        return os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    return "mock-qa-agent"


async def generate(
    messages: List[Message],
    *,
    system: Optional[str] = None,
    temperature: float = 0.2,
    max_tokens: int = 1200,
) -> Dict[str, Any]:
    provider = active_provider()
    if provider == "openai":
        return await _openai_generate(messages, system=system, temperature=temperature, max_tokens=max_tokens)
    if provider == "gemini":
        return await _gemini_generate(messages, system=system, temperature=temperature, max_tokens=max_tokens)
    return _mock_generate(messages, system=system)


async def _openai_generate(
    messages: List[Message],
    *,
    system: Optional[str],
    temperature: float,
    max_tokens: int,
) -> Dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        return _mock_generate(messages, system=system)
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    payload: Dict[str, Any] = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "messages": [],
    }
    if system:
        payload["messages"].append({"role": "system", "content": system})
    payload["messages"].extend(messages)
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
        )
        res.raise_for_status()
        data = res.json()
    text = data["choices"][0]["message"]["content"]
    return {"text": text, "provider": "openai", "model": model, "usage": data.get("usage")}


async def _gemini_generate(
    messages: List[Message],
    *,
    system: Optional[str],
    temperature: float,
    max_tokens: int,
) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        return _mock_generate(messages, system=system)
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    contents = []
    for m in messages:
        role = "user" if m["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m["content"]}]})
    body: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(url, params={"key": api_key}, json=body)
        res.raise_for_status()
        data = res.json()
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    text = "".join(p.get("text", "") for p in parts)
    return {"text": text, "provider": "gemini", "model": model}


def _mock_generate(messages: List[Message], *, system: Optional[str] = None) -> Dict[str, Any]:
    last = messages[-1]["content"] if messages else ""
    if "gap" in last.lower() or "repair" in last.lower():
        text = (
            "Suggested repair plan:\n"
            "1. forget() superseded Supabase architecture notes\n"
            "2. remember() final Next.js + Postgres + Cognee Cloud decision\n"
            "3. improve() with instruction: refuse private tokens, honor forget requests\n"
            "4. Rerun trap suite and export memory lint report"
        )
    elif "lint" in last.lower() or "contradiction" in last.lower():
        text = "Lint summary: 2 hard conflicts (stale stack, privacy leak), 1 temporal (presentation time). Gate blocked until surgery."
    else:
        text = (
            f"[Mock QA agent] Processed your request. Set OPENAI_API_KEY or GEMINI_API_KEY for live LLM.\n"
            f"Context snippet: {last[:200]}"
        )
    return {"text": text, "provider": "mock", "model": "mock-qa-agent"}