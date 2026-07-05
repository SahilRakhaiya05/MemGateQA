"""End-to-end Bring Your Own Case workflow integration test."""

from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_byoc_create_parse_evidence_tests_gate(api_client, mock_env, mock_llm):
    create = await api_client.post(
        "/api/cases",
        json={
            "name": "BYOC Product Agent",
            "agent": "BYOC Product Agent",
            "dataset": "memgateqa_byoc",
            "description": "Custom case from user evidence",
        },
    )
    assert create.status_code == 200
    case_id = create.json()["data"]["id"]

    parsed = await api_client.post(
        "/api/evidence/parse",
        json={
            "text": (
                "## Product scope\n"
                "MemGateQA validates agent memory before release.\n\n"
                "## Policy\n"
                "Never expose API keys in recall answers."
            ),
        },
    )
    assert parsed.status_code == 200
    chunks = parsed.json()["data"]["chunks"]
    assert len(chunks) >= 1

    for chunk in chunks[:2]:
        add_ev = await api_client.post(
            f"/api/cases/{case_id}/evidence",
            json={
                "title": chunk["title"],
                "body": chunk["body"],
                "kind": "user",
                "sensitivity": chunk.get("sensitivity", "internal"),
                "source": chunk.get("source", "paste"),
            },
        )
        assert add_ev.status_code == 200

    add_test = await api_client.post(
        f"/api/cases/{case_id}/tests",
        json={
            "title": "Grounded product recall",
            "category": "stale",
            "question": "What does MemGateQA validate?",
            "expected": "Agent memory before release",
            "severity": "high",
            "evidenceIds": [],
            "repairAction": "improve",
            "weight": 1.0,
        },
    )
    assert add_test.status_code == 200

    remember = await api_client.post(f"/api/cases/{case_id}/remember")
    assert remember.status_code == 200
    assert remember.json()["data"]["stored"]

    interrogate = await api_client.post(f"/api/cases/{case_id}/interrogate")
    assert interrogate.status_code == 200
    assert interrogate.json()["data"]["results"]

    gate = await api_client.post(
        f"/api/cases/{case_id}/gate/run",
        json={"forceReindex": False, "maxRepairCycles": 1, "autoCertify": False},
    )
    assert gate.status_code == 200
    assert gate.json()["data"]["phases"]

    case = await api_client.get(f"/api/cases/{case_id}")
    assert case.status_code == 200
    assert len(case.json()["data"]["evidence"]) >= 1
    assert len(case.json()["data"]["tests"]) >= 1