"""MemGateQA — production Cognee bridge with case persistence."""

from __future__ import annotations

import os
import tempfile
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from cognee_client import CogneeHttpClient, get_call_log
from grading import compute_health_breakdown, grade_test, health_score
from seed import ensure_seed
from storage import delete_case, get_case, list_cases, new_id, upsert_case

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_seed()
    yield


app = FastAPI(title="MemGateQA API", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EvidenceDocument(BaseModel):
    id: str = ""
    title: str
    body: str
    kind: str = "manual"
    shouldRemember: bool = True
    shouldForget: bool = False
    sensitivity: str = "internal"
    source: str = "manual"
    date: str = ""
    risk: str = ""


class MemoryTest(BaseModel):
    id: str = ""
    title: str
    category: str = "unsupported"
    question: str
    expected: str
    trap: str = ""
    severity: str = "medium"
    evidenceIds: List[str] = Field(default_factory=list)
    repairAction: str = "improve"
    weight: float = 0.1


class MemoryCasePayload(BaseModel):
    name: str
    agent: str
    dataset: str
    description: str = ""


class RememberPayload(BaseModel):
    dataset: str = ""
    evidence: List[EvidenceDocument] = Field(default_factory=list)


class ImprovePayload(BaseModel):
    dataset: str
    instruction: str
    approvedByHuman: bool = Field(default=False)


class ForgetPayload(BaseModel):
    dataset: str
    evidenceIds: List[str] = Field(default_factory=list)


class SurgeryPayload(BaseModel):
    dataset: str
    instruction: str
    evidenceIds: List[str] = Field(default_factory=list)
    approvedByHuman: bool = False


def mock_enabled() -> bool:
    return os.getenv("MEMGATEQA_MOCK", "true").lower() != "false"


def cognee_client() -> Optional[CogneeHttpClient]:
    if mock_enabled():
        return None
    base_url = os.getenv("COGNEE_BASE_URL", "").rstrip("/")
    api_key = os.getenv("COGNEE_API_KEY", "")
    if not base_url or not api_key:
        raise HTTPException(status_code=500, detail="Set COGNEE_BASE_URL and COGNEE_API_KEY in .env")
    return CogneeHttpClient(
        base_url=base_url,
        api_key=api_key,
        session_id=os.getenv("COGNEE_SESSION_ID", "memgateqa"),
        default_dataset=os.getenv("COGNEE_DATASET", "default_dataset"),
    )


def evidence_to_memory_text(doc: Dict[str, Any], dataset: str) -> str:
    return (
        f"[MemGateQA Evidence]\nDataset: {dataset}\nID: {doc.get('id')}\n"
        f"Title: {doc.get('title')}\nSource: {doc.get('source')}\n"
        f"Date: {doc.get('date')}\nSensitivity: {doc.get('sensitivity')}\n"
        f"Body: {doc.get('body')}"
    )


def _require_case(case_id: str) -> Dict[str, Any]:
    case = get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return case


def _mode() -> str:
    return "mock" if mock_enabled() else "proxy"


def _hit_text(hit: Dict[str, Any]) -> str:
    return hit.get("text") or hit.get("raw", {}).get("value", "") or str(hit)


async def _recall_answer(
    question: str,
    dataset: Optional[str] = None,
    *,
    search_type: str = "GRAPH_COMPLETION",
) -> tuple[str, List[Dict[str, Any]]]:
    client = cognee_client()
    if client is None:
        return f"[Mock recall for: {question}]", []
    hits = await client.recall(question, dataset, search_type=search_type, include_references=True)
    if not hits:
        return "(no recall results)", []
    return _hit_text(hits[0]), hits


@app.get("/health")
async def health() -> Dict[str, Any]:
    mode = "mock" if mock_enabled() else "cloud"
    ping_status: Optional[int] = None
    cognee_ok = False
    if not mock_enabled():
        try:
            ping_status = await cognee_client().ping()  # type: ignore[union-attr]
            cognee_ok = ping_status == 200
        except Exception:
            pass
    return {
        "ok": True,
        "mode": mode,
        "cognee_reachable": cognee_ok,
        "cognee_ping_status": ping_status,
        "session_id": os.getenv("COGNEE_SESSION_ID"),
        "dataset": os.getenv("COGNEE_DATASET", "default_dataset"),
        "case_count": len(list_cases()),
    }


@app.get("/api/cases")
async def api_list_cases() -> Dict[str, Any]:
    return {"ok": True, "mode": _mode(), "data": list_cases()}


@app.get("/api/cases/{case_id}")
async def api_get_case(case_id: str) -> Dict[str, Any]:
    return {"ok": True, "mode": _mode(), "data": _require_case(case_id)}


@app.post("/api/cases")
async def api_create_case(payload: MemoryCasePayload) -> Dict[str, Any]:
    case_id = new_id("case")
    case = {
        "id": case_id,
        **payload.model_dump(),
        "status": "open",
        "evidence": [],
        "tests": [],
        "resultsBefore": [],
        "resultsAfter": [],
        "reports": [],
    }
    return {"ok": True, "mode": _mode(), "data": upsert_case(case)}


@app.delete("/api/cases/{case_id}")
async def api_delete_case(case_id: str) -> Dict[str, Any]:
    if not delete_case(case_id):
        raise HTTPException(status_code=404, detail="Case not found")
    return {"ok": True, "data": {"deleted": case_id}}


@app.post("/api/cases/{case_id}/evidence")
async def api_add_evidence(case_id: str, doc: EvidenceDocument) -> Dict[str, Any]:
    case = _require_case(case_id)
    item = doc.model_dump()
    if not item["id"]:
        item["id"] = new_id("ev")
    case["evidence"].append(item)
    upsert_case(case)
    return {"ok": True, "mode": _mode(), "data": item}


@app.delete("/api/cases/{case_id}/evidence/{evidence_id}")
async def api_delete_evidence(case_id: str, evidence_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    case["evidence"] = [e for e in case["evidence"] if e["id"] != evidence_id]
    upsert_case(case)
    return {"ok": True, "data": {"deleted": evidence_id}}


@app.post("/api/cases/{case_id}/tests")
async def api_add_test(case_id: str, test: MemoryTest) -> Dict[str, Any]:
    case = _require_case(case_id)
    item = test.model_dump()
    if not item["id"]:
        item["id"] = new_id("test")
    case["tests"].append(item)
    upsert_case(case)
    return {"ok": True, "mode": _mode(), "data": item}


@app.delete("/api/cases/{case_id}/tests/{test_id}")
async def api_delete_test(case_id: str, test_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    case["tests"] = [t for t in case["tests"] if t["id"] != test_id]
    upsert_case(case)
    return {"ok": True, "data": {"deleted": test_id}}


@app.post("/api/cases/{case_id}/remember")
async def api_remember(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    client = cognee_client()
    stored: List[str] = []
    data_ids: Dict[str, str] = case.get("cogneeDataIds", {})
    for doc in case.get("evidence", []):
        if not doc.get("shouldRemember", True):
            continue
        if client is not None:
            text = evidence_to_memory_text(doc, dataset)
            result = await client.remember_fact(doc["id"], text, dataset)
            if result.get("data_id"):
                data_ids[doc["id"]] = result["data_id"]
        stored.append(doc["id"])
    if client is not None and stored:
        try:
            await client.memify(dataset)
        except HTTPException:
            pass
    case["cogneeDataIds"] = data_ids
    case["status"] = "intake"
    upsert_case(case)
    return {"ok": True, "mode": _mode(), "data": {"stored": stored, "dataset": dataset, "dataIds": data_ids}}


@app.post("/api/cases/{case_id}/interrogate")
async def api_interrogate(case_id: str, rerun: bool = False) -> Dict[str, Any]:
    case = _require_case(case_id)
    tests = case.get("tests", [])
    if not tests:
        raise HTTPException(status_code=400, detail="Add memory tests before interrogation")

    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    results: List[Dict[str, Any]] = []
    for test in tests:
        actual, hits = await _recall_answer(test["question"], dataset)
        graded = grade_test(test, actual)
        refs = []
        for hit in hits[:3]:
            for ref in hit.get("references", []) or hit.get("citations", []) or []:
                if isinstance(ref, dict):
                    refs.append(ref)
        if refs:
            graded["references"] = refs[:5]
        results.append(graded)

    key = "resultsAfter" if rerun else "resultsBefore"
    case[key] = results
    case["status"] = "repaired" if rerun else "tested"
    breakdown = compute_health_breakdown(results, tests)
    score = health_score(breakdown)
    case["lastScore"] = score
    case["lastBreakdown"] = breakdown
    upsert_case(case)

    return {
        "ok": True,
        "mode": _mode(),
        "data": {"results": results, "score": score, "breakdown": breakdown, "rerun": rerun},
    }


@app.post("/api/cases/{case_id}/surgery")
async def api_surgery(case_id: str, payload: SurgeryPayload) -> Dict[str, Any]:
    if not payload.approvedByHuman:
        raise HTTPException(status_code=403, detail="Memory surgery requires human approval")
    case = _require_case(case_id)
    dataset = payload.dataset or case.get("dataset", "default_dataset")
    client = cognee_client()
    forgotten: List[str] = []
    data_ids: Dict[str, str] = case.get("cogneeDataIds", {})
    if client is not None:
        for ev_id in payload.evidenceIds:
            data_id = data_ids.get(ev_id)
            try:
                await client.forget(dataset, data_id=data_id, fact_id=ev_id)
                forgotten.append(ev_id)
                data_ids.pop(ev_id, None)
            except HTTPException:
                pass
        await client.improve(dataset, f"[MemGateQA correction] {payload.instruction}")
        await client.memify(dataset)
    case["cogneeDataIds"] = data_ids
    case["status"] = "surgery"
    upsert_case(case)
    return {"ok": True, "mode": _mode(), "data": {"surgery": "complete", "caseId": case_id, "forgotten": forgotten}}


@app.post("/api/cases/{case_id}/rerun")
async def api_rerun(case_id: str) -> Dict[str, Any]:
    return await api_interrogate(case_id, rerun=True)


@app.get("/api/cases/{case_id}/graph")
async def api_graph(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    client = cognee_client()
    if client is None:
        return {"ok": True, "mode": _mode(), "data": {"nodes": [], "edges": [], "mock": True}}
    graph = await client.get_graph(dataset)
    return {"ok": True, "mode": _mode(), "data": graph}


@app.get("/api/cases/{case_id}/ops")
async def api_ops(case_id: str, limit: int = 40) -> Dict[str, Any]:
    _require_case(case_id)
    return {"ok": True, "mode": _mode(), "data": get_call_log(limit)}


@app.post("/api/cases/{case_id}/compare")
async def api_compare(case_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
    case = _require_case(case_id)
    test_id = body.get("testId")
    test = next((t for t in case.get("tests", []) if t["id"] == test_id), None)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    rag_answer, _ = await _recall_answer(test["question"], dataset, search_type="RAG_COMPLETION")
    graph_answer, graph_hits = await _recall_answer(test["question"], dataset, search_type="GRAPH_COMPLETION")
    rag_grade = grade_test(test, rag_answer)
    graph_grade = grade_test(test, graph_answer)
    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "testId": test_id,
            "question": test["question"],
            "rag": {"answer": rag_answer, "grade": rag_grade},
            "graph": {"answer": graph_answer, "grade": graph_grade, "references": graph_hits[0].get("references", []) if graph_hits else []},
        },
    }


@app.get("/api/cases/{case_id}/report")
async def api_report(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    before = case.get("resultsBefore", [])
    after = case.get("resultsAfter", [])
    tests = case.get("tests", [])
    breakdown_before = compute_health_breakdown(before, tests) if before else {}
    breakdown_after = compute_health_breakdown(after, tests) if after else {}
    report = {
        "caseId": case_id,
        "name": case.get("name"),
        "status": case.get("status"),
        "scoreBefore": health_score(breakdown_before) if before else None,
        "scoreAfter": health_score(breakdown_after) if after else None,
        "breakdownBefore": breakdown_before,
        "breakdownAfter": breakdown_after,
        "resultsBefore": before,
        "resultsAfter": after,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "mode": _mode(),
    }
    case["reports"] = case.get("reports", []) + [report]
    case["status"] = "closed"
    upsert_case(case)
    return {"ok": True, "mode": _mode(), "data": report}


# Legacy endpoints for backward compatibility
@app.post("/remember")
async def legacy_remember(payload: RememberPayload) -> Dict[str, Any]:
    client = cognee_client()
    dataset = payload.dataset or os.getenv("COGNEE_DATASET", "default_dataset")
    stored = []
    for doc in payload.evidence:
        if not doc.shouldRemember:
            continue
        if client:
            await client.remember_entry(question=doc.title, answer=evidence_to_memory_text(doc.model_dump(), dataset), dataset_name=dataset)
        stored.append(doc.id)
    return {"ok": True, "mode": _mode(), "data": {"stored": stored}}


@app.post("/recall")
async def legacy_recall(payload: Dict[str, Any]) -> Dict[str, Any]:
    question = payload.get("test", {}).get("question", "")
    actual, _ = await _recall_answer(question)
    return {"ok": True, "mode": _mode(), "data": {"question": question, "results": [{"answer": actual, "source": _mode()}]}}


@app.post("/improve")
async def legacy_improve(payload: ImprovePayload) -> Dict[str, Any]:
    if not payload.approvedByHuman:
        raise HTTPException(status_code=403, detail="Approval required")
    client = cognee_client()
    if client:
        await client.improve(payload.dataset, payload.instruction)
    return {"ok": True, "mode": _mode(), "data": {"improved": True}}


@app.post("/forget")
async def legacy_forget(payload: ForgetPayload) -> Dict[str, Any]:
    client = cognee_client()
    forgotten: List[str] = []
    if client:
        for ev_id in payload.evidenceIds:
            try:
                await client.forget(payload.dataset, fact_id=ev_id)
                forgotten.append(ev_id)
            except HTTPException:
                pass
    return {"ok": True, "mode": _mode(), "data": {"forgotten": forgotten}}


if __name__ == "__main__":
    uvicorn.run("cognee_bridge:app", host="0.0.0.0", port=8788, reload=False)