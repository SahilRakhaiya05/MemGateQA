"""JSON persistence for MemGateQA cases."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CASES_FILE = DATA_DIR / "cases.json"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_cases() -> Dict[str, Dict[str, Any]]:
    _ensure_data_dir()
    if not CASES_FILE.exists():
        return {}
    with CASES_FILE.open(encoding="utf-8") as handle:
        data = json.load(handle)
    return data if isinstance(data, dict) else {}


def save_cases(cases: Dict[str, Dict[str, Any]]) -> None:
    _ensure_data_dir()
    with CASES_FILE.open("w", encoding="utf-8") as handle:
        json.dump(cases, handle, indent=2, ensure_ascii=False)


def list_cases() -> List[Dict[str, Any]]:
    cases = load_cases()
    return sorted(cases.values(), key=lambda c: c.get("updatedAt", ""), reverse=True)


def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    return load_cases().get(case_id)


def upsert_case(case: Dict[str, Any]) -> Dict[str, Any]:
    cases = load_cases()
    case_id = case["id"]
    existing = cases.get(case_id, {})
    merged = {**existing, **case, "updatedAt": _now()}
    if "createdAt" not in merged:
        merged["createdAt"] = _now()
    cases[case_id] = merged
    save_cases(cases)
    return merged


def delete_case(case_id: str) -> bool:
    cases = load_cases()
    if case_id not in cases:
        return False
    del cases[case_id]
    save_cases(cases)
    return True


def new_id(prefix: str = "case") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"