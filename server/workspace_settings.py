"""Workspace settings — persisted config merged with .env for Cognee + LLM + MCP."""

from __future__ import annotations

import json
import os
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SETTINGS_FILE = DATA_DIR / "workspace.json"

DEFAULTS: Dict[str, Any] = {
    "llm": {
        "provider": "",
        "model": "",
        "openaiApiKey": "",
        "geminiApiKey": "",
        "openaiModel": "gpt-4o-mini",
        "geminiModel": "gemini-2.5-flash",
    },
    "cognee": {
        "baseUrl": "",
        "apiKey": "",
        "sessionId": "memgateqa",
        "defaultDataset": "default_dataset",

    },
    "mcp": {
        "enabled": True,
        "bridgeUrl": "http://localhost:8788",
    },
    "gate": {
        "autonomous": True,
        "maxRepairCycles": 3,
        "autoCertify": True,
    },
    "webhooks": {
        "enabled": False,
        "url": "",
        "secret": "",
        "events": ["agent.publish", "gate.ship_clear"],
    },
}

_SECRET_KEYS = {
    ("llm", "openaiApiKey"),
    ("llm", "geminiApiKey"),
    ("cognee", "apiKey"),
    ("webhooks", "secret"),
}


def _ensure_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_workspace() -> Dict[str, Any]:
    _ensure_dir()
    if not SETTINGS_FILE.exists():
        return deepcopy(DEFAULTS)
    with SETTINGS_FILE.open(encoding="utf-8") as handle:
        raw = json.load(handle)
    merged = deepcopy(DEFAULTS)
    for section, values in raw.items():
        if isinstance(values, dict) and section in merged:
            merged[section].update(values)
        else:
            merged[section] = values
    return merged


def save_workspace(patch: Dict[str, Any]) -> Dict[str, Any]:
    current = load_workspace()
    for section, values in patch.items():
        if isinstance(values, dict) and section in current and isinstance(current[section], dict):
            current[section].update(values)
        else:
            current[section] = values
    _ensure_dir()
    with SETTINGS_FILE.open("w", encoding="utf-8") as handle:
        json.dump(current, handle, indent=2, ensure_ascii=False)
    apply_to_env(current)
    return current


def apply_to_env(settings: Optional[Dict[str, Any]] = None) -> None:
    """Push workspace values into os.environ for runtime providers."""
    ws = settings or load_workspace()
    llm = ws.get("llm", {})
    cognee = ws.get("cognee", {})
    gate = ws.get("gate", {})
    mcp = ws.get("mcp", {})

    if llm.get("provider"):
        os.environ["LLM_PROVIDER"] = str(llm["provider"])
    if llm.get("openaiApiKey"):
        os.environ["OPENAI_API_KEY"] = str(llm["openaiApiKey"])
    if llm.get("geminiApiKey"):
        os.environ["GEMINI_API_KEY"] = str(llm["geminiApiKey"])
    if llm.get("openaiModel"):
        os.environ["OPENAI_MODEL"] = str(llm["openaiModel"])
    if llm.get("geminiModel"):
        os.environ["GEMINI_MODEL"] = str(llm["geminiModel"])
    model = llm.get("model") or ""
    if model:
        os.environ["LLM_MODEL"] = str(model)

    if cognee.get("baseUrl"):
        os.environ["COGNEE_BASE_URL"] = str(cognee["baseUrl"]).rstrip("/")
    if cognee.get("apiKey"):
        os.environ["COGNEE_API_KEY"] = str(cognee["apiKey"])
    if cognee.get("sessionId"):
        os.environ["COGNEE_SESSION_ID"] = str(cognee["sessionId"])
    if cognee.get("defaultDataset"):
        os.environ["COGNEE_DATASET"] = str(cognee["defaultDataset"])
    os.environ["MEMGATEQA_MOCK"] = "false"

    if mcp.get("bridgeUrl"):
        os.environ["MEMGATEQA_BRIDGE_URL"] = str(mcp["bridgeUrl"])

    os.environ["MEMGATEQA_AUTONOMOUS"] = "true" if gate.get("autonomous", True) else "false"
    if gate.get("maxRepairCycles") is not None:
        os.environ["MEMGATEQA_GATE_MAX_REPAIR_CYCLES"] = str(gate["maxRepairCycles"])
    os.environ["MEMGATEQA_GATE_AUTO_CERTIFY"] = "true" if gate.get("autoCertify", True) else "false"


def _mask_secret(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "••••••••"
    return f"{value[:4]}…{value[-4:]}"


def public_settings(settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    ws = deepcopy(settings or load_workspace())
    for section, key in _SECRET_KEYS:
        if section in ws and isinstance(ws[section], dict) and ws[section].get(key):
            ws[section][key] = _mask_secret(str(ws[section][key]))
            ws[section][f"{key}Set"] = True
    return ws


def cognee_config(settings: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
    ws = settings or load_workspace()
    cog = ws.get("cognee", {})
    return {
        "baseUrl": (cog.get("baseUrl") or os.getenv("COGNEE_BASE_URL", "")).rstrip("/"),
        "apiKey": cog.get("apiKey") or os.getenv("COGNEE_API_KEY", ""),
        "sessionId": cog.get("sessionId") or os.getenv("COGNEE_SESSION_ID", "memgateqa"),
        "defaultDataset": cog.get("defaultDataset") or os.getenv("COGNEE_DATASET", "default_dataset"),

    }


def resolve_llm(case: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    from model_tiers import resolve_tier_model

    ws = load_workspace()
    llm = ws.get("llm", {})
    c = case or {}
    provider = c.get("llmProvider") or llm.get("provider") or os.getenv("LLM_PROVIDER", "")
    if provider not in ("openai", "gemini") or provider == "mock":
        if os.getenv("OPENAI_API_KEY"):
            provider = "openai"
        elif os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
            provider = "gemini"
        else:
            provider = ""
    tier_id = c.get("modelTier") or "balanced"
    explicit = c.get("llmModel") or llm.get("model")
    if provider == "openai" and not explicit:
        explicit = llm.get("openaiModel") or os.getenv("OPENAI_MODEL")
    elif provider == "gemini" and not explicit:
        explicit = llm.get("geminiModel") or os.getenv("GEMINI_MODEL")
    if not provider:
        return {"provider": "", "model": "", "tier": tier_id, "maxTokens": 1200, "temperature": 0.2}
    tier_cfg = resolve_tier_model(provider, tier_id, explicit_model=explicit or None)
    return {"provider": provider, **tier_cfg}


def bootstrap_from_env() -> Dict[str, Any]:
    """Seed workspace view from .env when no saved file yet."""
    ws = load_workspace()
    if SETTINGS_FILE.exists():
        apply_to_env(ws)
        return ws
    llm = ws["llm"]
    cog = ws["cognee"]
    if os.getenv("COGNEE_BASE_URL"):
        cog["baseUrl"] = os.getenv("COGNEE_BASE_URL", "")
    if os.getenv("COGNEE_API_KEY"):
        cog["apiKey"] = os.getenv("COGNEE_API_KEY", "")
    if os.getenv("COGNEE_SESSION_ID"):
        cog["sessionId"] = os.getenv("COGNEE_SESSION_ID", cog["sessionId"])
    if os.getenv("COGNEE_DATASET"):
        cog["defaultDataset"] = os.getenv("COGNEE_DATASET", cog["defaultDataset"])
    cog.pop("mockMode", None)
    if os.getenv("LLM_PROVIDER"):
        llm["provider"] = os.getenv("LLM_PROVIDER", llm["provider"])
    if os.getenv("OPENAI_API_KEY"):
        llm["openaiApiKey"] = os.getenv("OPENAI_API_KEY", "")
    if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
        llm["geminiApiKey"] = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    if os.getenv("OPENAI_MODEL"):
        llm["openaiModel"] = os.getenv("OPENAI_MODEL", llm["openaiModel"])
    if os.getenv("GEMINI_MODEL"):
        llm["geminiModel"] = os.getenv("GEMINI_MODEL", llm["geminiModel"])
    if os.getenv("LLM_MODEL"):
        llm["model"] = os.getenv("LLM_MODEL", "")
    return ws


bootstrap_from_env()