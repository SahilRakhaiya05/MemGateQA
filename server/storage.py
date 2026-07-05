"""JSON persistence for MemGateQA cases."""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from filelock import FileLock

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CASES_FILE = DATA_DIR / "cases.json"
LOCK_FILE = DATA_DIR / "cases.json.lock"

SCHEMA_VERSION = 1
_SUPPORTED_SCHEMA_VERSIONS = {SCHEMA_VERSION}


class StorageSchemaError(ValueError):
    """Raised when persisted data uses an unsupported schema version."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _lock() -> FileLock:
    _ensure_data_dir()
    return FileLock(str(LOCK_FILE))


def _is_legacy_cases_dict(data: Any) -> bool:
    """Detect pre-schema_version format: top-level keys are case ids."""
    if not isinstance(data, dict) or not data:
        return False
    if "schema_version" in data or "cases" in data:
        return False
    return all(isinstance(value, dict) and "id" in value for value in data.values())


def _parse_storage_payload(data: Any) -> Dict[str, Dict[str, Any]]:
    if _is_legacy_cases_dict(data):
        return data

    if not isinstance(data, dict):
        raise StorageSchemaError("cases.json root must be an object.")

    version = data.get("schema_version")
    if version is None:
        raise StorageSchemaError("cases.json is missing schema_version.")

    if version not in _SUPPORTED_SCHEMA_VERSIONS:
        raise StorageSchemaError(
            f"Unsupported cases.json schema_version {version!r}; "
            f"supported versions: {sorted(_SUPPORTED_SCHEMA_VERSIONS)}."
        )

    cases = data.get("cases")
    if not isinstance(cases, dict):
        raise StorageSchemaError("cases.json 'cases' must be an object keyed by case id.")

    return cases


def _serialize_storage_payload(cases: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "cases": cases,
    }


def _atomic_write_json(path: Path, payload: Dict[str, Any]) -> None:
    _ensure_data_dir()
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    try:
        with tmp_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2, ensure_ascii=False)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(tmp_path, path)
    finally:
        if tmp_path.exists():
            tmp_path.unlink(missing_ok=True)


def load_cases() -> Dict[str, Dict[str, Any]]:
    _ensure_data_dir()
    with _lock():
        if not CASES_FILE.exists():
            return {}
        with CASES_FILE.open(encoding="utf-8") as handle:
            data = json.load(handle)
        return _parse_storage_payload(data)


def save_cases(cases: Dict[str, Dict[str, Any]]) -> None:
    payload = _serialize_storage_payload(cases)
    with _lock():
        _atomic_write_json(CASES_FILE, payload)


def list_cases() -> List[Dict[str, Any]]:
    cases = load_cases()
    return sorted(cases.values(), key=lambda c: c.get("updatedAt", ""), reverse=True)


def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    return load_cases().get(case_id)


def upsert_case(case: Dict[str, Any]) -> Dict[str, Any]:
    with _lock():
        cases = _load_cases_unlocked()
        case_id = case["id"]
        existing = cases.get(case_id, {})
        merged = {**existing, **case, "updatedAt": _now()}
        if "createdAt" not in merged:
            merged["createdAt"] = _now()
        cases[case_id] = merged
        _save_cases_unlocked(cases)
        return merged


def delete_case(case_id: str) -> bool:
    with _lock():
        cases = _load_cases_unlocked()
        if case_id not in cases:
            return False
        del cases[case_id]
        _save_cases_unlocked(cases)
        return True


def _load_cases_unlocked() -> Dict[str, Dict[str, Any]]:
    if not CASES_FILE.exists():
        return {}
    with CASES_FILE.open(encoding="utf-8") as handle:
        data = json.load(handle)
    return _parse_storage_payload(data)


def _save_cases_unlocked(cases: Dict[str, Dict[str, Any]]) -> None:
    _atomic_write_json(CASES_FILE, _serialize_storage_payload(cases))


def new_id(prefix: str = "case") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"