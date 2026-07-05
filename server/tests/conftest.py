"""Shared fixtures for MemGateQA API integration tests."""

from __future__ import annotations

import sys
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import storage  # noqa: E402
from config import get_settings, reload_settings  # noqa: E402


@pytest.fixture
def isolated_storage(tmp_path, monkeypatch):
    cases_file = tmp_path / "cases.json"
    lock_file = tmp_path / "cases.json.lock"
    monkeypatch.setattr(storage, "DATA_DIR", tmp_path)
    monkeypatch.setattr(storage, "CASES_FILE", cases_file)
    monkeypatch.setattr(storage, "LOCK_FILE", lock_file)
    yield cases_file


@pytest.fixture
def mock_env(monkeypatch, isolated_storage):
    monkeypatch.setenv("MEMGATEQA_MOCK", "true")
    monkeypatch.setenv("MEMGATEQA_AUTONOMOUS", "false")
    monkeypatch.setenv("MEMGATEQA_AUTO_AUDIT", "false")
    get_settings.cache_clear()
    reload_settings()
    yield
    get_settings.cache_clear()


@pytest_asyncio.fixture
async def api_client(mock_env) -> AsyncIterator[AsyncClient]:
    from cognee_bridge import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_llm(monkeypatch):
    async def _fake_generate(*_args, **_kwargs):
        return {"text": "Grounded mock answer citing evidence.", "provider": "openai", "model": "test-mock"}

    monkeypatch.setattr("llm_providers.generate", _fake_generate)
    monkeypatch.setattr("agent_loop.generate", _fake_generate)
    monkeypatch.setattr("autonomous_gate.generate", _fake_generate)