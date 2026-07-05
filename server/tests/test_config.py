"""Configuration validation tests."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import Settings, get_settings, reload_settings  # noqa: E402


def test_settings_requires_cognee_key_when_not_mock():
    settings = Settings.model_construct(cognee_api_key="", memgateqa_mock=False)
    with pytest.raises(RuntimeError, match="COGNEE_API_KEY"):
        settings.validate_required()


def test_settings_allows_mock_without_cognee_key():
    settings = Settings.model_construct(cognee_api_key="", memgateqa_mock=True)
    settings.validate_required()


def test_reload_settings_picks_up_env_changes(monkeypatch):
    monkeypatch.setenv("MEMGATEQA_MOCK", "true")
    monkeypatch.setenv("COGNEE_DATASET", "test_dataset_xyz")
    settings = reload_settings()
    assert settings.memgateqa_mock is True
    assert settings.cognee_dataset == "test_dataset_xyz"