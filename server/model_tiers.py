"""LLM model tiers — fast, balanced, deep research (curated presets only)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

MODEL_TIERS: Dict[str, Dict[str, Any]] = {
    "fast": {
        "id": "fast",
        "label": "Fast",
        "hint": "Quick replies · trap grading · chat",
        "maxTokens": 1200,
        "temperature": 0.2,
        "openai": ["gpt-4o-mini"],
        "gemini": ["gemini-2.5-flash"],
    },
    "balanced": {
        "id": "balanced",
        "label": "Balanced",
        "hint": "Grounded recall · everyday agent work",
        "maxTokens": 2000,
        "temperature": 0.25,
        "openai": ["gpt-4o"],
        "gemini": ["gemini-2.5-flash"],
    },
    "deep": {
        "id": "deep",
        "label": "Deep research",
        "hint": "Multi-hop reasoning · repair plans · root cause",
        "maxTokens": 4096,
        "temperature": 0.15,
        "openai": ["o3-mini"],
        "gemini": ["gemini-2.5-pro"],
    },
}


def list_tiers() -> List[Dict[str, Any]]:
    return [
        {
            "id": t["id"],
            "label": t["label"],
            "hint": t["hint"],
            "openaiModels": t["openai"],
            "geminiModels": t["gemini"],
        }
        for t in MODEL_TIERS.values()
    ]


def resolve_tier_model(
    provider: str,
    tier_id: str,
    *,
    explicit_model: Optional[str] = None,
    available: Optional[List[str]] = None,
) -> Dict[str, Any]:
    tier = MODEL_TIERS.get(tier_id) or MODEL_TIERS["balanced"]
    if explicit_model:
        return {
            "model": explicit_model,
            "tier": tier["id"],
            "maxTokens": tier["maxTokens"],
            "temperature": tier["temperature"],
        }
    candidates = tier.get(provider, tier.get("openai", []))
    if available:
        for c in candidates:
            if c in available:
                return {
                    "model": c,
                    "tier": tier["id"],
                    "maxTokens": tier["maxTokens"],
                    "temperature": tier["temperature"],
                }
        if available:
            return {
                "model": available[0],
                "tier": tier["id"],
                "maxTokens": tier["maxTokens"],
                "temperature": tier["temperature"],
            }
    return {
        "model": candidates[0] if candidates else "",
        "tier": tier["id"],
        "maxTokens": tier["maxTokens"],
        "temperature": tier["temperature"],
    }