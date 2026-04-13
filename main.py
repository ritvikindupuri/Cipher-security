#!/usr/bin/env python3
"""
GroundTrace: collect live Windows metrics from this machine, then run a 3-step Claude chain.
Attack scenarios are narrative-only and must stay grounded in the captured telemetry.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

from agents.chain import run_claude_chain
from collectors.windows_metrics import collect_snapshot, snapshot_to_json


def main() -> int:
    load_dotenv()

    ap = argparse.ArgumentParser(
        prog="groundtrace",
        description=(
            "GroundTrace: real Windows telemetry, chained Claude agents, grounded scenario text."
        ),
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Only collect telemetry; print JSON and skip Claude.",
    )
    ap.add_argument(
        "--save-telemetry",
        type=Path,
        metavar="PATH",
        help="Write the raw snapshot JSON to this file (e.g. data/snapshot.json).",
    )
    ap.add_argument(
        "--save-report",
        type=Path,
        metavar="PATH",
        help="Write full chain output JSON to this file.",
    )
    ap.add_argument(
        "--include-cmdline",
        action="store_true",
        help="Include truncated process command lines (may contain secrets; use carefully).",
    )
    ap.add_argument(
        "--no-perf-counters",
        action="store_true",
        help="Skip typeperf (Performance Counters) if it fails or is slow on your host.",
    )
    ap.add_argument(
        "--no-stream",
        action="store_true",
        help="Wait for each full agent reply before printing (no token-by-token stream).",
    )
    args = ap.parse_args()

    snap = collect_snapshot(
        include_cmdline=args.include_cmdline,
        include_perf_counters=not args.no_perf_counters,
    )

    if args.save_telemetry:
        args.save_telemetry.parent.mkdir(parents=True, exist_ok=True)
        args.save_telemetry.write_text(snapshot_to_json(snap), encoding="utf-8")

    if args.dry_run:
        print(snapshot_to_json(snap))
        return 0

    # Streaming is default: each agent writes to stdout as tokens arrive; banners go to stderr.
    result = run_claude_chain(snap, stream=not args.no_stream)

    if args.save_report:
        args.save_report.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "model": result.model,
            "agent1_facts": result.agent1_facts,
            "agent2_mapping": result.agent2_mapping,
            "agent3_scenario": result.agent3_scenario,
            "telemetry": json.loads(result.telemetry_json),
        }
        args.save_report.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Interrupted.", file=sys.stderr)
        raise SystemExit(130)
