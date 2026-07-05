"""Tests for atomic, versioned case persistence."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import storage  # noqa: E402


@pytest.fixture(autouse=True)
def isolated_cases_file(tmp_path, monkeypatch):
    cases_file = tmp_path / "cases.json"
    lock_file = tmp_path / "cases.json.lock"
    monkeypatch.setattr(storage, "DATA_DIR", tmp_path)
    monkeypatch.setattr(storage, "CASES_FILE", cases_file)
    monkeypatch.setattr(storage, "LOCK_FILE", lock_file)
    yield cases_file


def test_save_writes_schema_version(isolated_cases_file):
    storage.save_cases({"case-a": {"id": "case-a", "name": "Alpha"}})
    payload = json.loads(isolated_cases_file.read_text(encoding="utf-8"))
    assert payload["schema_version"] == storage.SCHEMA_VERSION
    assert payload["cases"]["case-a"]["name"] == "Alpha"


def test_load_migrates_legacy_format(isolated_cases_file):
    legacy = {"case-legacy": {"id": "case-legacy", "name": "Legacy Case"}}
    isolated_cases_file.write_text(json.dumps(legacy), encoding="utf-8")
    loaded = storage.load_cases()
    assert loaded == legacy


def test_load_rejects_unsupported_schema_version(isolated_cases_file):
    payload = {"schema_version": 999, "cases": {}}
    isolated_cases_file.write_text(json.dumps(payload), encoding="utf-8")
    with pytest.raises(storage.StorageSchemaError, match="Unsupported"):
        storage.load_cases()


def test_atomic_write_uses_tmp_file(isolated_cases_file, monkeypatch):
    replaced: list[tuple[Path, Path]] = []

    def track_replace(src, dst):
        replaced.append((Path(src), Path(dst)))

    monkeypatch.setattr(storage.os, "replace", track_replace)
    storage.save_cases({"case-b": {"id": "case-b"}})
    assert len(replaced) == 1
    assert replaced[0][0].suffix == ".tmp"
    assert replaced[0][1] == isolated_cases_file


def test_upsert_and_delete_round_trip(isolated_cases_file):
    storage.upsert_case({"id": "case-c", "name": "Created"})
    assert storage.get_case("case-c")["name"] == "Created"
    storage.upsert_case({"id": "case-c", "name": "Updated"})
    assert storage.get_case("case-c")["name"] == "Updated"
    assert storage.delete_case("case-c") is True
    assert storage.get_case("case-c") is None
    assert storage.delete_case("case-c") is False