"""Multi-provider LLM layer — OpenAI and Google AI."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx

Message = Dict[str, str]


class LlmNotConfiguredError(RuntimeError):
    pass


def active_provider() -> str:
    explicit = os.getenv("LLM_PROVIDER", "").strip().lower()
    if explicit in ("openai", "gemini"):
        return explicit
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
        return "gemini"
    return ""


async def list_gemini_models() -> List[str]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        return []
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.get(
                "https://generativelanguage.googleapis.com/v1beta/models",
                params={"key": api_key},
            )
            res.raise_for_status()
            data = res.json()
        out: List[str] = []
        for m in data.get("models", []):
            if "generateContent" not in m.get("supportedGenerationMethods", []):
                continue
            name = m.get("name", "").replace("models/", "")
            if name and "gemini" in name.lower() and "tts" not in name and "image" not in name and "robotics" not in name:
                out.append(name)
        return out[:30]
    except Exception:
        return []


async def provider_status_full() -> Dict[str, Any]:
    provider = active_provider()
    model = os.getenv("LLM_MODEL") or _default_model(provider)
    gemini_models: List[str] = []
    gemini_ok = False
    if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
        gemini_models = await list_gemini_models()
        gemini_ok = len(gemini_models) > 0
        if provider == "gemini" and gemini_models and model not in gemini_models:
            preferred = next((m for m in gemini_models if m == "gemini-2.5-flash"), gemini_models[0])
            model = preferred
    return {
        "provider": provider,
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "gemini": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
        "geminiReachable": gemini_ok,
        "model": model,
        "geminiModels": gemini_models,
    }


def provider_status() -> Dict[str, Any]:
    provider = active_provider()
    return {
        "provider": provider,
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "gemini": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
        "model": os.getenv("GEMINI_MODEL") or os.getenv("LLM_MODEL") or _default_model(provider),
    }


def _default_model(provider: str) -> str:
    if provider == "openai":
        return os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if provider == "gemini":
        return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    return ""


OPENAI_MODELS = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "o1-mini",
    "o3-mini",
]


async def list_openai_models() -> List[str]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        return list(OPENAI_MODELS)
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            res.raise_for_status()
            data = res.json()
        names = sorted(
            m["id"]
            for m in data.get("data", [])
            if any(
                m["id"].startswith(p)
                for p in ("gpt-4", "gpt-3.5", "o1", "o3", "o4")
            )
            and "realtime" not in m["id"]
            and "audio" not in m["id"]
        )
        merged = list(dict.fromkeys(names + OPENAI_MODELS))
        return merged[:30]
    except Exception:
        return list(OPENAI_MODELS)


async def test_llm(provider: Optional[str] = None, model: Optional[str] = None) -> Dict[str, Any]:
    p = provider or active_provider()
    if not p:
        return {"ok": False, "provider": "", "model": "", "error": "No LLM provider configured — set API key in Settings"}
    m = model or _default_model(p)
    try:
        result = await generate(
            [{"role": "user", "content": "Reply with exactly: MemGateQA LLM OK"}],
            system="You are a connectivity test. One short sentence only.",
            provider=p,
            model=m,
            max_tokens=40,
        )
        return {
            "ok": True,
            "provider": result.get("provider"),
            "model": result.get("model"),
            "sample": (result.get("text") or "")[:200],
        }
    except Exception as exc:
        return {"ok": False, "provider": p, "model": m, "error": str(exc)[:300]}


async def generate(
    messages: List[Message],
    *,
    system: Optional[str] = None,
    temperature: float = 0.2,
    max_tokens: int = 1200,
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    p = provider or active_provider()
    if not p:
        raise LlmNotConfiguredError("No LLM provider configured — set OPENAI_API_KEY or GEMINI_API_KEY in Settings")
    m = model or _default_model(p)
    if p == "openai":
        return await _openai_generate(messages, system=system, temperature=temperature, max_tokens=max_tokens, model=m)
    if p == "gemini":
        return await _gemini_generate(messages, system=system, temperature=temperature, max_tokens=max_tokens, model=m)
    raise LlmNotConfiguredError(f"Unsupported LLM provider: {p}")


async def _openai_generate(
    messages: List[Message],
    *,
    system: Optional[str],
    temperature: float,
    max_tokens: int,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise LlmNotConfiguredError("OPENAI_API_KEY not set — add it in Settings")
    model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    payload: Dict[str, Any] = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "messages": [],
    }
    if system:
        payload["messages"].append({"role": "system", "content": system})
    payload["messages"].extend(messages)
    timeout = 120.0 if model and any(model.startswith(p) for p in ("o1", "o3", "o4")) else 90.0
    async with httpx.AsyncClient(timeout=timeout) as client:
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
    model: Optional[str] = None,
) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        raise LlmNotConfiguredError("GEMINI_API_KEY not set — add it in Settings")
    model = model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
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
    timeout = 120.0 if model and ("pro" in model or "thinking" in model) else 90.0
    async with httpx.AsyncClient(timeout=timeout) as client:
        res = await client.post(url, params={"key": api_key}, json=body)
        res.raise_for_status()
        data = res.json()
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    text = "".join(p.get("text", "") for p in parts)
    return {"text": text, "provider": "gemini", "model": model}