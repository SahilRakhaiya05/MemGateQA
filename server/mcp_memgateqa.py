#!/usr/bin/env python3
"""MemGateQA MCP stdio server — expose QA tools to Cursor, Claude, Grok agents.

Run: python server/mcp_memgateqa.py
Configure in Cursor MCP:
  { "mcpServers": { "memgateqa": { "command": "python", "args": ["server/mcp_memgateqa.py"], "cwd": "<repo>" } } }
"""

from __future__ import annotations

import json
import sys
from typing import Any, Dict, List

import httpx

BRIDGE = "http://localhost:8788"

TOOLS: List[Dict[str, Any]] = [
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
        "description": "Index case evidence into Cognee via remember()",
        "inputSchema": {
            "type": "object",
            "properties": {"caseId": {"type": "string"}},
            "required": ["caseId"],
        },
    },
    {
        "name": "memgateqa_agent_chat",
        "description": "Chat with MemGateQA memory QA agent (Cognee recall + LLM)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "caseId": {"type": "string"},
                "message": {"type": "string"},
            },
            "required": ["caseId", "message"],
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
                    "serverInfo": {"name": "memgateqa", "version": "2.1.0"},
                },
            })
        elif method == "tools/list":
            _send({"jsonrpc": "2.0", "id": rid, "result": {"tools": TOOLS}})
        elif method == "tools/call":
            params = req.get("params", {})
            name = params.get("name", "")
            args = params.get("arguments", {}) or {}
            try:
                text = handle_tool(name, args)
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