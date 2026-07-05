"""Developer manifest — MCP tools, CLI, SDK, Cognee mapping for UI."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

REPO = Path(__file__).resolve().parent.parent

COGNEE_LINKS = {
    "pythonApi": "https://docs.cognee.ai/python-api",
    "remember": "https://docs.cognee.ai/core-concepts/main-operations/remember",
    "recall": "https://docs.cognee.ai/core-concepts/main-operations/recall",
    "improve": "https://docs.cognee.ai/core-concepts/main-operations/improve",
    "forget": "https://docs.cognee.ai/core-concepts/main-operations/forget",
    "cloudSdk": "https://docs.cognee.ai/cognee-cloud/connections/cloud-sdk",
    "github": "https://github.com/topoteretes/cognee",
    "hackathon": "https://www.wemakedevs.org/hackathons/cognee/resources",
}

COGNEE_VALUE: List[Dict[str, Any]] = [
    {
        "op": "remember()",
        "cognee": "Ingest text/files into knowledge graph + vector index",
        "memgateqa": "Index case evidence packets; private items excluded from public dataset",
        "helps": "Agents get memory — MemGateQA proves what was actually stored and grounded",
    },
    {
        "op": "recall()",
        "cognee": "Semantic + graph traversal query over stored memory",
        "memgateqa": "Fire trap questions; grade stale/privacy/premise/forget failures",
        "helps": "Cognee answers questions — MemGateQA catches wrong, leaky, or stale answers",
    },
    {
        "op": "improve()",
        "cognee": "Enrich graph, prune stale nodes, apply human feedback",
        "memgateqa": "Human-approved repair instruction after trap failures",
        "helps": "Cognee adapts memory — MemGateQA gates mutations behind explicit approval",
    },
    {
        "op": "forget()",
        "cognee": "Prune or delete datasets / facts from graph",
        "memgateqa": "Remove private tokens + honor forget requests; verify with negative recall",
        "helps": "Cognee deletes data — MemGateQA proves deletion with trap re-tests",
    },
    {
        "op": "memify()",
        "cognee": "Graph enrichment / ontology consolidation after ingest",
        "memgateqa": "Runs after remember() and improve() to strengthen contradiction links",
        "helps": "Cognee builds graph structure — MemGateQA scores whether structure resolves conflicts",
    },
]

MCP_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "memory",
        "category": "Memory engine",
        "description": "Save or forget a fact in MemGate Memory Engine (per-case container)",
        "cogneeOp": "remember / forget (via bridge on audit)",
        "argsExample": {"caseId": "case-wolfpack", "action": "save", "content": "Final demo is 2 PM"},
        "sdkCall": "sdk.memory(content)",
    },
    {
        "name": "recall",
        "category": "Memory engine",
        "description": "Hybrid search: local MemGate facts + Cognee graph recall",
        "cogneeOp": "recall()",
        "argsExample": {"caseId": "case-wolfpack", "query": "What database are we using?", "mode": "hybrid"},
        "sdkCall": "sdk.recall(query, 'hybrid')",
    },
    {
        "name": "context",
        "category": "Memory engine",
        "description": "Inject full memory profile for agent system prompts",
        "cogneeOp": "recall (profile aggregation)",
        "argsExample": {"caseId": "case-wolfpack"},
        "sdkCall": "sdk.context()",
    },
    {
        "name": "memgateqa_remember",
        "category": "Cognee lifecycle",
        "description": "Index all case evidence into Cognee remember() + MemGate index",
        "cogneeOp": "remember() + memify()",
        "argsExample": {"caseId": "case-wolfpack"},
        "sdkCall": "sdk.remember()",
    },
    {
        "name": "memgateqa_interrogate",
        "category": "Cognee lifecycle",
        "description": "Run all trap tests: recall() per question + deterministic grade",
        "cogneeOp": "recall()",
        "argsExample": {"caseId": "case-wolfpack"},
        "sdkCall": "sdk.interrogate()",
    },
    {
        "name": "memgateqa_auto_audit",
        "category": "Automation",
        "description": "INDEX → interrogate traps → loop-engineering pipeline",
        "cogneeOp": "remember → recall → improve plan",
        "argsExample": {"caseId": "case-wolfpack", "forceReindex": False},
        "sdkCall": "sdk.autoAudit()",
    },
    {
        "name": "memgateqa_run_auto_agent",
        "category": "Automation",
        "description": "Full autonomous pipeline: sync → audit → repair → scheduler",
        "cogneeOp": "remember → recall → improve → forget → recall",
        "argsExample": {"caseId": "case-wolfpack", "applyRepair": True, "startAutoLoop": False},
        "sdkCall": "sdk.runAutoAgent({ startAutoLoop: false })",
    },
    {
        "name": "memgateqa_run_full_loop",
        "category": "Loop engineering",
        "description": "Single pass: observe → recall → grade → plan → verify",
        "cogneeOp": "recall + improve planning",
        "argsExample": {"caseId": "case-wolfpack"},
        "sdkCall": "sdk.runFullLoop()",
    },
    {
        "name": "memgateqa_auto_loop",
        "category": "Loop engineering",
        "description": "Start/stop/status background scheduler until ship-ready ≥80%",
        "cogneeOp": "recall (interval)",
        "argsExample": {"caseId": "case-wolfpack", "action": "start", "intervalSec": 120},
        "sdkCall": "sdk.autoLoopStart(120)",
    },
    {
        "name": "memgateqa_loop_tick",
        "category": "Loop engineering",
        "description": "Run one loop-engineering step manually",
        "cogneeOp": "recall",
        "argsExample": {"caseId": "case-wolfpack", "stepId": "grade"},
        "sdkCall": "sdk.loopTick('grade')",
    },
    {
        "name": "memgateqa_list_cases",
        "category": "Case API",
        "description": "List all memory audit cases",
        "cogneeOp": None,
        "argsExample": {},
        "sdkCall": "sdk.listCases()",
    },
    {
        "name": "memgateqa_get_case",
        "category": "Case API",
        "description": "Get case with evidence, tests, results, scores",
        "cogneeOp": None,
        "argsExample": {"caseId": "case-wolfpack"},
        "sdkCall": "sdk.getCase()",
    },
    {
        "name": "memgateqa_agent_chat",
        "category": "LLM agent",
        "description": "Chat with memory QA agent using hybrid memory + Cognee recall",
        "cogneeOp": "recall + LLM",
        "argsExample": {"caseId": "case-wolfpack", "message": "What traps failed?"},
        "sdkCall": "sdk.agentChat(message)",
    },
]

CLI_GROUPS: List[Dict[str, Any]] = [
    {
        "group": "Case lifecycle (maps to Cognee remember/recall/improve)",
        "commands": [
            {"cmd": "npm run cli -- case remember case-wolfpack", "desc": "Cognee remember() — index evidence", "maps": "remember()"},
            {"cmd": "npm run cli -- case interrogate case-wolfpack", "desc": "Trap recall() + grade", "maps": "recall()"},
            {"cmd": "npm run cli -- case rerun case-wolfpack", "desc": "Re-run traps after repair", "maps": "recall()"},
            {"cmd": "npm run cli -- audit case-wolfpack", "desc": "Auto audit pipeline", "maps": "remember → recall"},
            {"cmd": "npm run cli -- audit case-wolfpack --force", "desc": "Force re-index", "maps": "remember()"},
        ],
    },
    {
        "group": "Memory engine",
        "commands": [
            {"cmd": 'npm run cli -- memory recall case-wolfpack "what traps failed"', "desc": "Hybrid recall search", "maps": "recall()"},
            {"cmd": "npm run cli -- memory context case-wolfpack", "desc": "Print context inject", "maps": "context profile"},
        ],
    },
    {
        "group": "Automation",
        "commands": [
            {"cmd": "npm run agent:run", "desc": "Full auto agent one case", "maps": "full lifecycle"},
            {"cmd": "npm run agent:fleet", "desc": "Auto agent all cases", "maps": "full lifecycle"},
            {"cmd": "npm run loop:run", "desc": "Single full loop", "maps": "recall loop"},
            {"cmd": "npm run loop:auto", "desc": "Start auto scheduler", "maps": "recall interval"},
        ],
    },
    {
        "group": "MCP & agents",
        "commands": [
            {"cmd": "npm run mcp", "desc": "Start MCP stdio server (Claude/Cursor)", "maps": "stdio bridge"},
            {"cmd": "npm run mcp:config", "desc": "Print .mcp.json for Cursor/Claude", "maps": "MCP config"},
            {"cmd": 'npm run cli -- chat case-wolfpack "Summarize memory health"', "desc": "LLM agent chat", "maps": "recall + LLM"},
        ],
    },
]

SDK_METHODS: List[Dict[str, Any]] = [
    {"method": "remember()", "desc": "Index evidence → Cognee remember()", "example": "await sdk.remember()", "cognee": "remember"},
    {"method": "interrogate()", "desc": "Run trap suite → Cognee recall()", "example": "await sdk.interrogate()", "cognee": "recall"},
    {"method": "rerun()", "desc": "Post-repair trap rerun", "example": "await sdk.rerun()", "cognee": "recall"},
    {"method": "autoAudit(force?)", "desc": "INDEX → traps → loop", "example": "await sdk.autoAudit()", "cognee": "remember → recall"},
    {"method": "runAutoAgent(opts?)", "desc": "Full autonomous pipeline", "example": "await sdk.runAutoAgent({ startAutoLoop: false })", "cognee": "full lifecycle"},
    {"method": "memory(content)", "desc": "Save MemGate fact (triggers auto-audit if enabled)", "example": "await sdk.memory('New decision: Postgres')", "cognee": "remember path"},
    {"method": "recall(query, mode)", "desc": "Hybrid MemGate + Cognee search", "example": "await sdk.recall('demo time', 'hybrid')", "cognee": "recall"},
    {"method": "context()", "desc": "Memory profile for prompts", "example": "await sdk.context()", "cognee": "recall aggregate"},
    {"method": "runFullLoop()", "desc": "observe→recall→grade→plan", "example": "await sdk.runFullLoop()", "cognee": "recall loop"},
    {"method": "autoLoopStart(sec)", "desc": "Background scheduler", "example": "await sdk.autoLoopStart(120)", "cognee": "recall interval"},
    {"method": "agentChat(msg)", "desc": "LLM + memory chat", "example": "await sdk.agentChat('What failed?')", "cognee": "recall + LLM"},
    {"method": "listCases()", "desc": "All audit cases", "example": "await sdk.listCases()", "cognee": None},
    {"method": "getCase()", "desc": "Current case dossier", "example": "await sdk.getCase()", "cognee": None},
]

AGENT_SETUP: List[Dict[str, Any]] = [
    {
        "id": "cursor",
        "name": "Cursor IDE",
        "icon": "◈",
        "steps": [
            "Run .\\start.ps1 so bridge is on :8788",
            "Project already has .mcp.json — or run npm run mcp:config",
            "Cursor → Settings → MCP → Enable memgateqa server",
            "Restart MCP; agent can call memgateqa_remember, memgateqa_interrogate, etc.",
            "Example: 'Run memgateqa_run_auto_agent on case-wolfpack'",
        ],
        "configFile": ".mcp.json",
    },
    {
        "id": "claude",
        "name": "Claude Code / Desktop",
        "icon": "✳",
        "steps": [
            "npm run mcp:config — copy JSON output",
            "Add to ~/.claude/claude_desktop_config.json under mcpServers",
            "Ensure MEMGATEQA_BRIDGE_URL=http://localhost:8788",
            "Claude invokes tools via stdio — each tool hits FastAPI bridge → Cognee Cloud",
        ],
        "configFile": "claude_desktop_config.json",
    },
    {
        "id": "codex",
        "name": "Codex / Terminal CLI",
        "icon": "◇",
        "steps": [
            "npm run cli -- case remember case-wolfpack",
            "npm run cli -- case interrogate case-wolfpack",
            "npm run agent:run — full auto pipeline",
            "Or: npm run mcp for stdio tools in other agents",
        ],
        "configFile": "terminal",
    },
    {
        "id": "sdk",
        "name": "TypeScript SDK",
        "icon": "⬡",
        "steps": [
            "import { createMemGateSdk } from './sdk/memgateSdk'",
            "const sdk = createMemGateSdk('case-wolfpack')",
            "All calls go to VITE_COGNEE_PROXY_URL (bridge) — never expose Cognee keys in browser",
            "Use in React panels or Node scripts with bridge running",
        ],
        "configFile": "src/sdk/memgateSdk.ts",
    },
]

ARCHITECTURE_FLOW = [
    "Cursor / Claude / Codex / SDK / CLI",
    "    ↓ stdio MCP or HTTP",
    "FastAPI bridge :8788 (cognee_bridge.py)",
    "    ↓ X-Api-Key (server-side only)",
    "Cognee Cloud — remember · recall · improve · forget · memify",
    "    ↓",
    "MemGate Memory Engine (local facts + hybrid search)",
    "    ↓",
    "Trap grading → Memory Health Score → Ship proof",
]


def build_mcp_config_json() -> Dict[str, Any]:
    py = str(REPO / ".venv" / "Scripts" / "python.exe") if os.name == "nt" else str(REPO / ".venv" / "bin" / "python")
    if not Path(py).exists():
        py = sys.executable
    bridge = os.getenv("MEMGATEQA_BRIDGE_URL", "http://localhost:8788").rstrip("/")
    return {
        "mcpServers": {
            "memgateqa": {
                "command": py,
                "args": [str(REPO / "server" / "mcp_memgateqa.py")],
                "cwd": str(REPO),
                "env": {"MEMGATEQA_BRIDGE_URL": bridge},
            }
        }
    }


def developer_manifest() -> Dict[str, Any]:
    return {
        "cogneeLinks": COGNEE_LINKS,
        "cogneeValue": COGNEE_VALUE,
        "architectureFlow": ARCHITECTURE_FLOW,
        "mcp": {
            "transport": "stdio",
            "server": "server/mcp_memgateqa.py",
            "bridgeEnv": "MEMGATEQA_BRIDGE_URL",
            "toolCount": len(MCP_TOOLS),
            "tools": MCP_TOOLS,
            "config": build_mcp_config_json(),
        },
        "cli": {
            "entry": "python server/memgate_cli.py",
            "npm": "npm run cli --",
            "groups": CLI_GROUPS,
        },
        "sdk": {
            "entry": "src/sdk/memgateSdk.ts",
            "factory": "createMemGateSdk(caseId)",
            "methods": SDK_METHODS,
        },
        "agentSetup": AGENT_SETUP,
        "pitch": (
            "Cognee gives agents long-term memory. MemGateQA is the QA gate that tests "
            "whether that memory is fresh, grounded, private, and safe — using every "
            "Cognee lifecycle API with human-approved repair and exportable proof."
        ),
    }