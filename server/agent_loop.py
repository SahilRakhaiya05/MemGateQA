"""MemGate QA agent loop — loop-engineering pattern with native memory engine."""

from __future__ import annotations

from typing import Any, Awaitable, Callable, Dict, List, Optional

from llm_providers import generate
from loop_store import LOOP_STEPS, append_ledger, get_ledger, get_state, sync_from_case, to_loop_md, to_state_md
from memgate_memory import (
    build_context,
    container_tag_for_case,
    get_profile,
    search_hybrid,
)

RecallFn = Callable[[str, str], Awaitable[tuple[str, List[Dict[str, Any]]]]]


def loop_state(case: Dict[str, Any]) -> Dict[str, Any]:
    data = sync_from_case(case)
    return {
        "caseId": case.get("id"),
        "status": data["state"].get("status"),
        "health": data["state"].get("health"),
        "trapCount": data["state"].get("trapCount"),
        "failCount": data["state"].get("failCount"),
        "shipReady": data["state"].get("shipReady"),
        "loopReadyScore": data["state"].get("loopReadyScore"),
        "lastStep": data["state"].get("lastStep"),
        "steps": LOOP_STEPS,
        "loop": data["loop"],
        "ledgerPreview": get_ledger(case["id"], limit=5),
        "stateMd": to_state_md(case),
        "loopMd": to_loop_md(case["id"]),
    }


async def agent_chat(
    case: Dict[str, Any],
    message: str,
    recall_fn: RecallFn,
) -> Dict[str, Any]:
    dataset = case.get("dataset", "default_dataset")
    tag = container_tag_for_case(case["id"])
    hybrid = await search_hybrid(tag, message, dataset=dataset, recall_fn=recall_fn, mode="hybrid")
    memory_context, hits = await recall_fn(message, dataset)
    profile = get_profile(tag, query=message)
    context_block = build_context(tag, case_name=case.get("name", ""), health=case.get("lastScore"))

    local_snippet = "\n".join(r["text"][:200] for r in hybrid.get("results", [])[:3])
    system = (
        "You are MemGateQA, a memory QA agent. You gate agent memory before production deploy. "
        "Use MemGate hybrid memory (local facts + Cognee graph recall). Be concise. "
        "Recommend remember/recall/improve/forget when relevant. "
        "Never auto-mutate memory — human approval required for surgery."
    )
    user_prompt = (
        f"Case: {case.get('name')}\n"
        f"Health: {case.get('lastScore')}% · Status: {case.get('status')}\n"
        f"MemGate profile static: {profile['profile'].get('static', [])[:4]}\n"
        f"Hybrid memory:\n{local_snippet or '(index evidence first)'}\n"
        f"Cognee recall:\n{memory_context}\n"
        f"Context inject:\n{context_block}\n\n"
        f"User: {message}"
    )
    llm = await generate([{"role": "user", "content": user_prompt}], system=system)
    append_ledger(case["id"], {"op": "agent_chat", "message": message[:120], "provider": llm.get("provider")})
    return {
        "answer": llm["text"],
        "provider": llm.get("provider"),
        "model": llm.get("model"),
        "recallPreview": memory_context[:500],
        "hybridResults": hybrid.get("results", [])[:5],
        "profile": profile["profile"],
        "references": hits[:3],
    }


async def gap_fill_plan(case: Dict[str, Any], failures: List[Dict[str, Any]]) -> Dict[str, Any]:
    lines = []
    for f in failures[:8]:
        test = next((t for t in case.get("tests", []) if t["id"] == f.get("testId")), None)
        if test:
            lines.append(f"- [{test.get('category')}] {test.get('title')}: expected «{test.get('expected', '')[:80]}»")
    prompt = (
        "Generate a human-approved memory surgery plan for these failed trap tests. "
        "Use Cognee lifecycle: remember(), recall(), improve(), forget().\n"
        + "\n".join(lines)
    )
    llm = await generate(
        [{"role": "user", "content": prompt}],
        system="You are a Cognee memory repair architect. Output numbered steps only.",
    )
    append_ledger(case["id"], {"stepId": "plan", "op": "gap_fill", "failureCount": len(failures)})
    return {"plan": llm["text"], "provider": llm.get("provider"), "failureCount": len(failures)}


async def run_loop_tick(
    case: Dict[str, Any],
    step_id: str,
    *,
    recall_fn: Optional[RecallFn] = None,
) -> Dict[str, Any]:
    step = next((s for s in LOOP_STEPS if s["id"] == step_id), None)
    if not step:
        return {"error": f"Unknown step {step_id}"}
    state = loop_state(case)
    tag = container_tag_for_case(case["id"])
    dataset = case.get("dataset", "default_dataset")
    detail = f"Step {step['label']} ({step['op']}) — health {state['health']}% · {state['failCount']} failures"

    if step_id == "observe":
        evidence_n = len(case.get("evidence", []))
        tests_n = len(case.get("tests", []))
        detail = (
            f"Audit: {evidence_n} evidence packets · {tests_n} traps · "
            f"health {state['health']}% · {state['failCount']} open failures · "
            f"loop ready {state['loopReadyScore']}/100"
        )
    elif step_id == "recall" and recall_fn:
        q = case["tests"][0].get("question", "What is the current architecture?") if case.get("tests") else "Summarize case memory"
        hybrid = await search_hybrid(tag, q, dataset=dataset, recall_fn=recall_fn)
        detail = f"Hybrid recall ({hybrid.get('localCount', 0)} local + Cognee): " + (
            hybrid["results"][0]["text"][:400] if hybrid.get("results") else "(empty — run INDEX first)"
        )
    elif step_id == "grade":
        before = case.get("resultsBefore") or []
        fails = [r for r in before if r.get("status") == "fail"]
        detail = f"Trap suite: {len(before)} run · {len(fails)} fail · score {state['health']}%"
        if fails:
            detail += "\n" + "\n".join(
                f"  ✗ {next((t['title'] for t in case.get('tests', []) if t['id'] == f.get('testId')), f.get('testId'))}"
                for f in fails[:5]
            )
    elif step_id == "plan" and state["failCount"] > 0:
        failures = [r for r in (case.get("resultsBefore") or []) if r.get("status") == "fail"]
        plan = await gap_fill_plan(case, failures)
        detail = plan["plan"][:800]
    elif step_id == "verify":
        after = case.get("resultsAfter") or []
        before = case.get("resultsBefore") or []
        if after:
            b_score = case.get("lastScore")
            detail = f"Verify: post-repair score {b_score}% · ship ready {state['shipReady']}"
        elif before:
            detail = f"Verify blocked: run memory surgery first ({state['failCount']} failures remain)"
        else:
            detail = "Verify blocked: run interrogation first"

    append_ledger(case["id"], {"stepId": step_id, "label": step["label"], "detail": detail[:300]})
    sync_from_case(case)
    return {
        "step": step,
        "state": loop_state(case),
        "detail": detail,
        "humanGate": step_id in get_state(case["id"])["loop"].get("humanGateSteps", []),
    }