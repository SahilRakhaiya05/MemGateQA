#!/usr/bin/env python3
"""MemGateQA CLI — loop, memory, case ops for Codex / Claude Code / terminal.

Usage:
  python server/memgate_cli.py loop run case-wolfpack
  python server/memgate_cli.py loop auto start case-wolfpack --interval 120
  python server/memgate_cli.py loop auto stop case-wolfpack
  python server/memgate_cli.py memory recall case-wolfpack "what traps failed"
  python server/memgate_cli.py case interrogate case-wolfpack
  python server/memgate_cli.py case remember case-wolfpack
  python server/memgate_cli.py mcp-config
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import httpx

BRIDGE = os.getenv("MEMGATEQA_BRIDGE_URL", "http://localhost:8788").rstrip("/")
REPO = Path(__file__).resolve().parent.parent


def _api(method: str, path: str, body: dict | None = None) -> dict:
    with httpx.Client(timeout=180.0) as client:
        if method == "GET":
            r = client.get(f"{BRIDGE}{path}")
        else:
            r = client.post(f"{BRIDGE}{path}", json=body or {})
        if r.status_code >= 400:
            print(r.text, file=sys.stderr)
            sys.exit(1)
        return r.json()


def cmd_loop_run(args: argparse.Namespace) -> None:
    data = _api("POST", f"/api/cases/{args.case_id}/loop/run-full")
    print(json.dumps(data.get("data", data), indent=2))


def cmd_loop_auto(args: argparse.Namespace) -> None:
    if args.action == "start":
        body = {"intervalSec": args.interval}
        data = _api("POST", f"/api/cases/{args.case_id}/loop/auto/start", body)
    elif args.action == "stop":
        data = _api("POST", f"/api/cases/{args.case_id}/loop/auto/stop")
    else:
        data = _api("GET", f"/api/cases/{args.case_id}/loop/auto/status")
    print(json.dumps(data.get("data", data), indent=2))


def cmd_memory_recall(args: argparse.Namespace) -> None:
    data = _api("POST", f"/api/cases/{args.case_id}/memory/search", {
        "query": args.query,
        "mode": args.mode,
    })
    print(json.dumps(data.get("data", data), indent=2))


def cmd_memory_context(args: argparse.Namespace) -> None:
    data = _api("GET", f"/api/cases/{args.case_id}/memory/context")
    print(data.get("data", {}).get("context", ""))


def cmd_case_action(args: argparse.Namespace) -> None:
    data = _api("POST", f"/api/cases/{args.case_id}/{args.action}")
    print(json.dumps(data.get("data", data), indent=2))


def cmd_agent_chat(args: argparse.Namespace) -> None:
    data = _api("POST", f"/api/cases/{args.case_id}/agent/chat", {"message": args.message})
    print(data.get("data", {}).get("answer", json.dumps(data, indent=2)))


def cmd_mcp_config() -> None:
    py = str(REPO / ".venv" / "Scripts" / "python.exe") if os.name == "nt" else str(REPO / ".venv" / "bin" / "python")
    if not Path(py).exists():
        py = sys.executable
    config = {
        "mcpServers": {
            "memgateqa": {
                "command": py,
                "args": [str(REPO / "server" / "mcp_memgateqa.py")],
                "cwd": str(REPO),
                "env": {"MEMGATEQA_BRIDGE_URL": BRIDGE},
            }
        }
    }
    print(json.dumps(config, indent=2))
    print("\n# Claude Code: add to ~/.claude/claude_desktop_config.json or project .mcp.json", file=sys.stderr)
    print("# Cursor: Settings → MCP → Add server", file=sys.stderr)
    print("# Codex CLI: codex mcp add memgateqa -- python server/mcp_memgateqa.py", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description="MemGateQA CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)

    loop_p = sub.add_parser("loop", help="Loop engineering")
    loop_sub = loop_p.add_subparsers(dest="loop_cmd", required=True)
    run_p = loop_sub.add_parser("run", help="Run full loop once")
    run_p.add_argument("case_id")
    run_p.set_defaults(func=cmd_loop_run)

    auto_p = loop_sub.add_parser("auto", help="Auto loop scheduler")
    auto_p.add_argument("action", choices=["start", "stop", "status"])
    auto_p.add_argument("case_id")
    auto_p.add_argument("--interval", type=int, default=120)
    auto_p.set_defaults(func=cmd_loop_auto)

    mem_p = sub.add_parser("memory", help="MemGate memory engine")
    mem_sub = mem_p.add_subparsers(dest="mem_cmd", required=True)
    recall_p = mem_sub.add_parser("recall", help="Hybrid recall")
    recall_p.add_argument("case_id")
    recall_p.add_argument("query")
    recall_p.add_argument("--mode", default="hybrid", choices=["hybrid", "memories", "documents"])
    recall_p.set_defaults(func=cmd_memory_recall)
    ctx_p = mem_sub.add_parser("context", help="Print context inject")
    ctx_p.add_argument("case_id")
    ctx_p.set_defaults(func=cmd_memory_context)

    case_p = sub.add_parser("case", help="Case lifecycle")
    case_p.add_argument("action", choices=["remember", "interrogate", "rerun"])
    case_p.add_argument("case_id")
    case_p.set_defaults(func=cmd_case_action)

    chat_p = sub.add_parser("chat", help="Agent chat")
    chat_p.add_argument("case_id")
    chat_p.add_argument("message")
    chat_p.set_defaults(func=cmd_agent_chat)

    mcp_p = sub.add_parser("mcp-config", help="Print MCP JSON for Claude/Cursor/Codex")
    mcp_p.set_defaults(func=lambda _a: cmd_mcp_config())

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()