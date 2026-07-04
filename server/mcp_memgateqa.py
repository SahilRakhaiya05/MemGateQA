#!/usr/bin/env python3
"""MemGateQA MCP stdio server — native memory + loop + Cognee QA tools.

Supermemory-pattern tools (memory, recall, context) implemented natively.
Run: python server/mcp_memgateqa.py
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any, Dict, List

import httpx

BRIDGE = os.getenv("MEMGATEQA_BRIDGE_URL", "http://localhost:8788").rstrip("/")

TOOLS: List[Dict[str, Any]] = [
    {
        "name": "memory",
        "description": "Save or forget a memory fact in MemGate Memory Engine (container = case)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "caseId": {"type": "string"},
                "action": {"type": "string", "enum": ["save", "forget"]},
                "content": {"type": "string"},
                "factId": {"type": "string"},
            },
            "required": ["caseId", "action"],
        },
    },
    {
        "name": "recall",
        "description": "Hybrid search — MemGate local facts + Cognee graph recall",
        "inputSchema": {
            "type": "object",
            "properties": {
                "caseId": {"type": "string"},
                "query": {"type": "string"},
                "mode": {"type": "string", "enum": ["hybrid", "memories", "documents"]},
            },
            "required": ["caseId", "query"],
        },
    },
    {
        "name": "context",
        "description": "Inject full MemGate memory profile + context for a case",
        "inputSchema": {
            "type": "object",
            "properties": {"caseId": {"type": "string"}},
            "required": ["caseId"],
        },
    },
    {
        "name": "memgateqa_list_cases",
        "description": "List all memory audit cases in MemGateQA",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "memgateqa_get_case",
        "description": "Get a case by id including evidence, tests, results",
        "inputSchema": {
            "type": "object",
            "properties": {"caseId": {"type": "string"}},
            "required": ["caseId"],
        },
    },
    {
        "name": "memgateqa_interrogate",
        "description": "Run trap test interrogation (recall + grade) for a case",
        "inputSchema": {
            "type": "object",
            "properties": {"caseId": {"type": "string"}},
            "required": ["caseId"],
        },
    },
    {
        "name": "memgateqa_remember",
        "description": "Index case evidence into Cognee + MemGate Memory via remember()",
        "inputSchema": {
            "type": "object",
            "properties": {"caseId": {"type": "string"}},
            "required": ["caseId"],
        },
    },
    {
        "name": "memgateqa_agent_chat",
        "description": "Chat with MemGateQA memory QA agent (hybrid memory + Cognee + LLM)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "caseId": {"type": "string"},
                "message": {"type": "string"},
            },
            "required": ["caseId", "message"],
        },
    },
    {
        "name": "memgateqa_loop_tick",
        "description": "Run one loop-engineering tick: observe|recall|grade|plan|verify",
        "inputSchema": {
            "type": "object",
            "properties": {
                "caseId": {"type": "string"},
                "stepId": {"type": "string"},
            },
            "required": ["caseId", "stepId"],
        },
    },
    {
        "name": "memgateqa_auto_audit",
        "description": "Auto audit new memory: INDEX → interrogate traps → full QA loop (Cognee + Gemini)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "caseId": {"type": "string"},
                "forceReindex": {"type": "boolean"},
            },
            "required": ["caseId"],
        },
    },
    {
        "name": "memgateqa_run_full_loop",
        "description": "Run complete memory QA loop (observe→recall→grade→plan) for a case",
        "inputSchema": {
            "type": "object",
            "properties": {"caseId": {"type": "string"}},
            "required": ["caseId"],
        },
    },
    {
        "name": "memgateqa_auto_loop",
        "description": "Start/stop/status auto loop scheduler (runs full loop on interval until ship-ready)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "caseId": {"type": "string"},
                "action": {"type": "string", "enum": ["start", "stop", "status"]},
                "intervalSec": {"type": "integer"},
            },
            "required": ["caseId", "action"],
        },
    },
    {
        "name": "memgateqa_run_auto_agent",
        "description": "Full autonomous agent: sync memory → audit → repair → rerun → auto loop scheduler",
        "inputSchema": {
            "type": "object",
            "properties": {
                "caseId": {"type": "string"},
                "applyRepair": {"type": "boolean"},
                "startAutoLoop": {"type": "boolean"},
                "intervalSec": {"type": "integer"},
                "forceReindex": {"type": "boolean"},
            },
            "required": ["caseId"],
        },
    },
]


def _send(msg: Dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(msg) + "\n")
    sys.stdout.flush()


def _bridge(method: str, path: str, body: Dict[str, Any] | None = None) -> Any:
    with httpx.Client(timeout=120.0) as client:
        if method == "GET":
            r = client.get(f"{BRIDGE}{path}")
        else:
            r = client.post(f"{BRIDGE}{path}", json=body or {})
        r.raise_for_status()
        return r.json()


def handle_tool(name: str, args: Dict[str, Any]) -> str:
    if name == "memory":
        case_id = args["caseId"]
        if args["action"] == "save":
            data = _bridge("POST", f"/api/cases/{case_id}/memory/add", {"content": args.get("content", ""), "kind": "mcp"})
            return json.dumps(data.get("data", {}), indent=2)
        data = _bridge("POST", f"/api/cases/{case_id}/memory/forget", {"factId": args.get("factId")})
        return json.dumps(data.get("data", {}), indent=2)
    if name == "recall":
        data = _bridge("POST", f"/api/cases/{args['caseId']}/memory/search", {
            "query": args["query"],
            "mode": args.get("mode", "hybrid"),
        })
        return json.dumps(data.get("data", {}), indent=2)
    if name == "context":
        data = _bridge("GET", f"/api/cases/{args['caseId']}/memory/context")
        return json.dumps(data.get("data", {}), indent=2)
    if name == "memgateqa_list_cases":
        data = _bridge("GET", "/api/cases")
        return json.dumps(data.get("data", []), indent=2)
    if name == "memgateqa_get_case":
        data = _bridge("GET", f"/api/cases/{args['caseId']}")
        return json.dumps(data.get("data", {}), indent=2)
    if name == "memgateqa_interrogate":
        data = _bridge("POST", f"/api/cases/{args['caseId']}/interrogate")
        return json.dumps(data.get("data", {}), indent=2)
    if name == "memgateqa_remember":
        data = _bridge("POST", f"/api/cases/{args['caseId']}/remember")
        return json.dumps(data.get("data", {}), indent=2)
    if name == "memgateqa_agent_chat":
        data = _bridge("POST", f"/api/cases/{args['caseId']}/agent/chat", {"message": args["message"]})
        return json.dumps(data.get("data", {}), indent=2)
    if name == "memgateqa_loop_tick":
        data = _bridge("POST", f"/api/cases/{args['caseId']}/agent/loop", {"stepId": args.get("stepId", "observe")})
        return json.dumps(data.get("data", {}), indent=2)
    if name == "memgateqa_auto_audit":
        qs = "?force=true" if args.get("forceReindex") else ""
        data = _bridge("POST", f"/api/cases/{args['caseId']}/audit/auto{qs}")
        return json.dumps(data.get("data", {}), indent=2)
    if name == "memgateqa_run_full_loop":
        data = _bridge("POST", f"/api/cases/{args['caseId']}/loop/run-full")
        return json.dumps(data.get("data", {}), indent=2)
    if name == "memgateqa_auto_loop":
        action = args.get("action", "status")
        case_id = args["caseId"]
        if action == "start":
            data = _bridge("POST", f"/api/cases/{case_id}/loop/auto/start", {"intervalSec": args.get("intervalSec", 120)})
        elif action == "stop":
            data = _bridge("POST", f"/api/cases/{case_id}/loop/auto/stop")
        else:
            data = _bridge("GET", f"/api/cases/{case_id}/loop/auto/status")
        return json.dumps(data.get("data", {}), indent=2)
    if name == "memgateqa_run_auto_agent":
        body = {
            "applyRepair": args.get("applyRepair", True),
            "startAutoLoop": args.get("startAutoLoop", True),
            "intervalSec": args.get("intervalSec", 120),
            "forceReindex": args.get("forceReindex", False),
        }
        data = _bridge("POST", f"/api/cases/{args['caseId']}/agent/run-all", body)
        return json.dumps(data.get("data", {}), indent=2)
    return json.dumps({"error": f"Unknown tool {name}"})


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            continue
        rid = req.get("id")
        method = req.get("method")
        if method == "initialize":
            _send({
                "jsonrpc": "2.0",
                "id": rid,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "memgateqa", "version": "3.1.0"},
                },
            })
        elif method == "tools/list":
            _send({"jsonrpc": "2.0", "id": rid, "result": {"tools": TOOLS}})
        elif method == "tools/call":
            params = req.get("params", {})
            tool_name = params.get("name", "")
            tool_args = params.get("arguments", {}) or {}
            try:
                text = handle_tool(tool_name, tool_args)
                _send({
                    "jsonrpc": "2.0",
                    "id": rid,
                    "result": {"content": [{"type": "text", "text": text}]},
                })
            except Exception as e:
                _send({
                    "jsonrpc": "2.0",
                    "id": rid,
                    "result": {"content": [{"type": "text", "text": str(e)}], "isError": True},
                })
        elif method == "notifications/initialized":
            pass
        else:
            if rid is not None:
                _send({"jsonrpc": "2.0", "id": rid, "error": {"code": -32601, "message": "Method not found"}})


if __name__ == "__main__":
    main()