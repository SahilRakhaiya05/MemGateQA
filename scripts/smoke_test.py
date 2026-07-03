#!/usr/bin/env python3
"""Verify Cognee Cloud lifecycle ops for MemGateQA judges."""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "server"))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

DATASET = os.getenv("COGNEE_SMOKE_DATASET", "memgateqa_smoke_test")
FACT_ID = "smoke_fact_001"


async def main() -> int:
    from cognee_client import CogneeHttpClient

    base = os.getenv("COGNEE_BASE_URL", "").rstrip("/")
    key = os.getenv("COGNEE_API_KEY", "")
    if not base or not key:
        print("FAIL: Set COGNEE_BASE_URL and COGNEE_API_KEY in .env")
        return 1

    client = CogneeHttpClient(base, key, "memgateqa-smoke", DATASET)
    print(f"Target: {base}")
    print(f"Dataset: {DATASET}\n")

    steps: list[tuple[str, bool, str]] = []

    try:
        ping = await client.ping()
        steps.append(("ping datasets", ping == 200, f"status {ping}"))
    except Exception as exc:
        steps.append(("ping datasets", False, str(exc)))

    try:
        remembered = await client.remember_fact(FACT_ID, "MemGateQA smoke test: Doug is the groom.", DATASET)
        steps.append(("remember", bool(remembered), str(remembered.get("data_id", "no data_id"))))
    except Exception as exc:
        steps.append(("remember", False, str(exc)))

    try:
        await client.memify(DATASET)
        steps.append(("memify/cognify", True, "ok"))
    except Exception as exc:
        steps.append(("memify/cognify", False, str(exc)))

    try:
        hits = await client.recall("Who is Doug?", DATASET, include_references=True)
        text = hits[0].get("text", "") if hits else ""
        steps.append(("recall", len(text) > 5, text[:80]))
    except Exception as exc:
        steps.append(("recall", False, str(exc)))

    try:
        await client.improve(DATASET, "Smoke test correction: wedding is Sunday.")
        steps.append(("improve", True, "ok"))
    except Exception as exc:
        steps.append(("improve", False, str(exc)))

    try:
        await client.forget(DATASET, fact_id=FACT_ID)
        steps.append(("forget", True, FACT_ID))
    except Exception as exc:
        steps.append(("forget", False, str(exc)))

    print("Results:")
    ok_all = True
    for name, ok, detail in steps:
        mark = "PASS" if ok else "FAIL"
        print(f"  [{mark}] {name}: {detail}")
        ok_all = ok_all and ok

    print(f"\n{'ALL PASSED' if ok_all else 'SOME FAILED'} — {len(steps)} steps")
    return 0 if ok_all else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))