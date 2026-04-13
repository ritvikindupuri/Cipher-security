"""
Collect a single-point snapshot of this Windows machine using live OS APIs only.
No synthetic metrics: if a probe fails, the field records an error string instead of a guess.
"""

from __future__ import annotations

import csv
import json
import platform
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any

import psutil

_MAX_PROCESSES = 50
_MAX_CONNECTIONS = 150


def _require_windows() -> None:
    if sys.platform != "win32":
        raise RuntimeError(
            "This collector targets Windows only. Run on your Windows machine or remove this guard for porting."
        )


def _truncate_cmdline(args: list[str] | None, max_chars: int = 200) -> str | None:
    if not args:
        return None
    joined = " ".join(args)
    if len(joined) <= max_chars:
        return joined
    return joined[: max_chars - 3] + "..."


def _run_typeperf(counters: list[str]) -> dict[str, Any]:
    """
    Real Performance Counters via built-in typeperf (no extra installs).
    """
    cmd = ["typeperf", *counters, "-sc", "1"]
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=15,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
        )
    except (OSError, subprocess.TimeoutExpired) as e:
        return {"error": str(e)}

    if proc.returncode != 0:
        return {"error": proc.stderr.strip() or f"exit {proc.returncode}"}

    lines = [ln.rstrip() for ln in proc.stdout.splitlines() if ln.strip()]
    if len(lines) < 2:
        return {"error": "unexpected typeperf output", "raw_tail": lines}

    if lines[0].lstrip().startswith("(PDH-CSV") or lines[0].startswith('"(PDH-CSV'):
        header_line = lines[1] if len(lines) > 1 else lines[0]
    else:
        header_line = lines[0]
    data_line = lines[-1]

    cols = next(csv.reader([header_line]))
    vals = next(csv.reader([data_line]))
    out: dict[str, Any] = {}
    for name, val in zip(cols[1:], vals[1:]):
        key = name.strip().strip('"')
        raw_val = val.strip().strip('"')
        try:
            out[key] = float(raw_val)
        except ValueError:
            out[key] = raw_val
    return out


def collect_snapshot(
    *,
    include_cmdline: bool = False,
    include_perf_counters: bool = True,
) -> dict[str, Any]:
    _require_windows()
    now = datetime.now(timezone.utc).isoformat()

    uname = platform.uname()
    win_ver = platform.win32_ver()

    snapshot: dict[str, Any] = {
        "schema": "groundtrace_windows_snapshot_v1",
        "collected_at_utc": now,
        "host": {
            "node": uname.node,
            "system": uname.system,
            "release": uname.release,
            "version": uname.version,
            "machine": uname.machine,
            "processor": uname.processor,
            "windows": {
                "version": win_ver[0],
                "build": win_ver[1],
                "csd": win_ver[2],
                "edition": win_ver[3] or None,
            },
        },
        "boot_time_utc": datetime.fromtimestamp(
            psutil.boot_time(), tz=timezone.utc
        ).isoformat(),
        "cpu": {
            "logical_cpus": psutil.cpu_count(logical=True),
            "physical_cpus": psutil.cpu_count(logical=False),
            "usage_percent_interval_0_5s": psutil.cpu_percent(interval=0.5),
        },
        "memory": {
            "virtual": psutil.virtual_memory()._asdict(),
            "swap": psutil.swap_memory()._asdict(),
        },
        "disks": [],
        "network_io": psutil.net_io_counters()._asdict(),
        "processes": [],
        "network_connections": [],
        "perf_counters": None,
    }

    for part in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(part.mountpoint)
            snapshot["disks"].append(
                {
                    "device": part.device,
                    "mountpoint": part.mountpoint,
                    "fstype": part.fstype,
                    "opts": part.opts,
                    "total_bytes": usage.total,
                    "used_bytes": usage.used,
                    "free_bytes": usage.free,
                    "percent_used": usage.percent,
                }
            )
        except PermissionError as e:
            snapshot["disks"].append(
                {"device": part.device, "mountpoint": part.mountpoint, "error": str(e)}
            )

    procs: list[tuple[float, dict[str, Any]]] = []
    for p in psutil.process_iter(
        ["pid", "ppid", "name", "username", "memory_info", "num_threads", "exe"]
    ):
        try:
            info = p.info
            rss = float(info["memory_info"].rss) if info.get("memory_info") else 0.0
            row: dict[str, Any] = {
                "pid": info["pid"],
                "ppid": info.get("ppid"),
                "name": info.get("name"),
                "username": info.get("username"),
                "rss_bytes": int(rss),
                "num_threads": info.get("num_threads"),
                "exe": info.get("exe"),
            }
            if include_cmdline:
                try:
                    row["cmdline"] = _truncate_cmdline(p.cmdline())
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    row["cmdline"] = None
            procs.append((rss, row))
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    procs.sort(key=lambda x: x[0], reverse=True)
    snapshot["processes"] = [r for _, r in procs[:_MAX_PROCESSES]]

    conns: list[dict[str, Any]] = []
    for c in psutil.net_connections(kind="inet"):
        if len(conns) >= _MAX_CONNECTIONS:
            break
        try:
            laddr = f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else None
            raddr = (
                f"{c.raddr.ip}:{c.raddr.port}" if c.raddr and c.raddr.ip else None
            )
            conns.append(
                {
                    "fd": c.fd,
                    "family": str(c.family),
                    "type": str(c.type),
                    "local": laddr,
                    "remote": raddr,
                    "status": c.status,
                    "pid": c.pid,
                }
            )
        except (OSError, ValueError):
            continue
    snapshot["network_connections"] = conns

    if include_perf_counters:
        snapshot["perf_counters"] = _run_typeperf(
            [
                r"\Processor(_Total)\% Processor Time",
                r"\Memory\Available MBytes",
            ]
        )

    return snapshot


def snapshot_to_json(snapshot: dict[str, Any]) -> str:
    return json.dumps(snapshot, indent=2, default=str)
