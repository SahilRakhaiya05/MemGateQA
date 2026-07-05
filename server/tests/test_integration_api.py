"""Integration tests for cognee_bridge routes (mock mode, no live Cognee/LLM)."""

from __future__ import annotations

import pytest

from agent_publish import publish_agent
from seed import ensure_seed, wolfpack_case
from storage import get_case, upsert_case


@pytest.mark.asyncio
async def test_health_and_list_cases(api_client):
    res = await api_client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert "bridge_version" in body

    res = await api_client.get("/api/cases")
    assert res.status_code == 200
    assert res.json()["ok"] is True


@pytest.mark.asyncio
async def test_cases_crud(api_client):
    create = await api_client.post(
        "/api/cases",
        json={
            "name": "Integration Case",
            "agent": "Test Agent",
            "dataset": "memgateqa_integration",
            "description": "CRUD test case",
        },
    )
    assert create.status_code == 200
    case_id = create.json()["data"]["id"]

    get_res = await api_client.get(f"/api/cases/{case_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["name"] == "Integration Case"

    delete_res = await api_client.delete(f"/api/cases/{case_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["data"]["deleted"] == case_id

    missing = await api_client.get(f"/api/cases/{case_id}")
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_evidence_crud(api_client):
    case = (
        await api_client.post(
            "/api/cases",
            json={"name": "Evidence Case", "agent": "Agent", "dataset": "memgateqa_ev", "description": ""},
        )
    ).json()["data"]
    case_id = case["id"]

    add = await api_client.post(
        f"/api/cases/{case_id}/evidence",
        json={
            "title": "Policy fact",
            "body": "All deployments require security review before production release.",
            "kind": "policy",
            "sensitivity": "internal",
        },
    )
    assert add.status_code == 200
    ev_id = add.json()["data"]["id"]

    delete = await api_client.delete(f"/api/cases/{case_id}/evidence/{ev_id}")
    assert delete.status_code == 200
    assert delete.json()["data"]["deleted"] == ev_id


@pytest.mark.asyncio
async def test_evidence_parse(api_client):
    res = await api_client.post(
        "/api/evidence/parse",
        json={"text": "## Release policy\nAll deployments require security review before production."},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["chunkCount"] >= 1
    assert data["chunks"][0]["title"]


@pytest.mark.asyncio
async def test_remember_interrogate_rerun(api_client, mock_env):
    ensure_seed()
    case_id = "case-wolfpack"

    remember = await api_client.post(f"/api/cases/{case_id}/remember")
    assert remember.status_code == 200
    assert remember.json()["data"]["stored"]

    interrogate = await api_client.post(f"/api/cases/{case_id}/interrogate")
    assert interrogate.status_code == 200
    results = interrogate.json()["data"]["results"]
    assert len(results) > 0
    assert "score" in interrogate.json()["data"]

    rerun = await api_client.post(f"/api/cases/{case_id}/rerun")
    assert rerun.status_code == 200
    assert rerun.json()["data"]["rerun"] is True


@pytest.mark.asyncio
async def test_surgery_requires_approval(api_client, mock_env):
    ensure_seed()
    case_id = "case-wolfpack"
    blocked = await api_client.post(
        f"/api/cases/{case_id}/surgery",
        json={"dataset": "memgateqa_wolfpack", "instruction": "repair", "evidenceIds": [], "approvedByHuman": False},
    )
    assert blocked.status_code == 403

    approved = await api_client.post(
        f"/api/cases/{case_id}/surgery",
        json={
            "dataset": "memgateqa_wolfpack",
            "instruction": "Apply feedback repair for stale trap.",
            "evidenceIds": ["ev-private-token"],
            "approvedByHuman": True,
            "actorRole": "owner",
        },
    )
    assert approved.status_code == 200


@pytest.mark.asyncio
async def test_public_agent_chat(api_client, mock_env, mock_llm):
    case = wolfpack_case()
    case["id"] = "case-public-test"
    case["visibility"] = "private"
    upsert_case(case)
    pub = publish_agent("case-public-test", visibility="public")
    slug = pub["publishSlug"]

    profile = await api_client.get(f"/api/public/agents/{slug}")
    assert profile.status_code == 200
    assert profile.json()["data"]["publishSlug"] == slug

    chat = await api_client.post(
        f"/api/public/agents/{slug}/chat",
        json={"message": "What is the demo time?"},
    )
    assert chat.status_code == 200
    assert chat.json()["data"]["answer"]


@pytest.mark.asyncio
async def test_public_chat_rejects_oversized_message(api_client, mock_env):
    case = wolfpack_case()
    case["id"] = "case-oversize"
    upsert_case(case)
    pub = publish_agent("case-oversize", visibility="public")
    slug = pub["publishSlug"]

    res = await api_client.post(
        f"/api/public/agents/{slug}/chat",
        json={"message": "x" * 5000},
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_autonomous_gate_run(api_client, mock_env, mock_llm):
    ensure_seed()
    case_id = "case-wolfpack"
    await api_client.post(f"/api/cases/{case_id}/remember")

    gate = await api_client.post(
        f"/api/cases/{case_id}/gate/run",
        json={"forceReindex": False, "maxRepairCycles": 1, "autoCertify": False},
    )
    assert gate.status_code == 200
    data = gate.json()["data"]
    assert "phases" in data
    assert data.get("ok") is not False

    status = await api_client.get(f"/api/cases/{case_id}/gate/status")
    assert status.status_code == 200
    assert "autonomousEnabled" in status.json()["data"]


@pytest.mark.asyncio
async def test_loop_runner_endpoints(api_client, mock_env, mock_llm):
    ensure_seed()
    case_id = "case-wolfpack"

    full = await api_client.post(f"/api/cases/{case_id}/loop/run-full")
    assert full.status_code == 200

    start = await api_client.post(
        f"/api/cases/{case_id}/loop/auto/start",
        json={"intervalSec": 120},
    )
    assert start.status_code == 200

    status = await api_client.get(f"/api/cases/{case_id}/loop/auto/status")
    assert status.status_code == 200

    stop = await api_client.post(f"/api/cases/{case_id}/loop/auto/stop")
    assert stop.status_code == 200
    assert stop.json()["data"]["running"] is False