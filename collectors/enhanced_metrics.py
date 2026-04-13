"""
GroundTrace - Enhanced Collector with Command Logging
Logs all system commands being executed and their raw outputs for transparency
"""

from __future__ import annotations

import json
import platform
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any, Callable
from dataclasses import dataclass, field, asdict
from pathlib import Path
import psutil

MAX_PROCESSES = 50
MAX_CONNECTIONS = 150


@dataclass
class CommandLog:
    """Record of a single command execution"""
    timestamp: str
    command: str
    category: str
    description: str
    status: str  # "running", "success", "error"
    output: str = ""
    error: str = ""
    duration_ms: float = 0


@dataclass
class TelemetrySession:
    """Complete telemetry collection session with full audit trail"""
    session_id: str
    started_at: str
    commands: list = field(default_factory=list)
    final_snapshot: dict = field(default_factory=dict)
    completed_at: str = ""
    total_commands: int = 0
    successful_commands: int = 0
    failed_commands: int = 0
    
    def add_command(self, cmd: CommandLog):
        self.commands.append(asdict(cmd))
        self.total_commands += 1
        if cmd.status == "success":
            self.successful_commands += 1
        elif cmd.status == "error":
            self.failed_commands += 1


class LoggingCollector:
    """Collector that logs all commands and outputs for transparency"""
    
    def __init__(self, on_command_update: Callable[[CommandLog], None] | None = None):
        self.session = TelemetrySession(
            session_id=f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            started_at=datetime.now(timezone.utc).isoformat()
        )
        self.on_command_update = on_command_update
        self._cmd_count = 0
        
    def _log_command(
        self,
        command: str,
        category: str,
        description: str,
        status: str,
        output: str = "",
        error: str = "",
        duration_ms: float = 0
    ):
        cmd_log = CommandLog(
            timestamp=datetime.now(timezone.utc).isoformat(),
            command=command,
            category=category,
            description=description,
            status=status,
            output=output,
            error=error,
            duration_ms=duration_ms
        )
        self.session.add_command(cmd_log)
        self._cmd_count += 1
        
        if self.on_command_update:
            self.on_command_update(cmd_log)
            
        return cmd_log
    
    def _run_command(
        self,
        cmd: list[str],
        category: str,
        description: str,
        timeout: int = 30
    ) -> subprocess.CompletedProcess:
        """Execute a command and log the result"""
        import time
        start = time.time()
        cmd_str = " ".join(cmd)
        
        self._log_command(cmd_str, category, description, "running")
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            duration = (time.time() - start) * 1000
            
            if result.returncode == 0:
                self._log_command(cmd_str, category, description, "success", result.stdout, "", duration)
            else:
                self._log_command(cmd_str, category, description, "error", result.stdout, result.stderr, duration)
                
            return result
            
        except subprocess.TimeoutExpired:
            duration = (time.time() - start) * 1000
            self._log_command(cmd_str, category, description, "error", "", "Command timed out", duration)
            raise
        except Exception as e:
            duration = (time.time() - start) * 1000
            self._log_command(cmd_str, category, description, "error", "", str(e), duration)
            raise
    
    def collect_full_telemetry(self) -> dict[str, Any]:
        """Collect all telemetry with full command logging"""
        
        # Step 1: System Info
        self._log_command(
            "platform.uname()",
            "SYSTEM_INFO",
            "Gathering basic system information",
            "running"
        )
        
        uname = platform.uname()
        win_ver = platform.win32_ver()
        
        self._log_command(
            "platform.uname()",
            "SYSTEM_INFO",
            "Gathering basic system information",
            "success",
            json.dumps({
                "node": uname.node,
                "system": uname.system,
                "release": uname.release,
                "version": uname.version,
                "machine": uname.machine,
                "processor": uname.processor
            }, indent=2)
        )
        
        # Step 2: Boot Time
        self._log_command(
            "psutil.boot_time()",
            "SYSTEM_INFO",
            "Retrieving system boot timestamp",
            "running"
        )
        boot_time = psutil.boot_time()
        self._log_command(
            "psutil.boot_time()",
            "SYSTEM_INFO",
            "Retrieving system boot timestamp",
            "success",
            f"Boot time: {datetime.fromtimestamp(boot_time, tz=timezone.utc).isoformat()}"
        )
        
        # Step 3: CPU Info
        self._log_command(
            "psutil.cpu_percent()",
            "CPU",
            "Measuring CPU usage over 0.5s interval",
            "running"
        )
        cpu_percent = psutil.cpu_percent(interval=0.5)
        self._log_command(
            "psutil.cpu_percent()",
            "CPU",
            "Measuring CPU usage over 0.5s interval",
            "success",
            f"CPU Usage: {cpu_percent}%"
        )
        
        self._log_command(
            "psutil.cpu_count()",
            "CPU",
            "Counting logical and physical CPU cores",
            "running"
        )
        logical_cpus = psutil.cpu_count(logical=True)
        physical_cpus = psutil.cpu_count(logical=False)
        self._log_command(
            "psutil.cpu_count()",
            "CPU",
            "Counting logical and physical CPU cores",
            "success",
            f"Logical CPUs: {logical_cpus}, Physical CPUs: {physical_cpus}"
        )
        
        # Step 4: Memory Info
        self._log_command(
            "psutil.virtual_memory()",
            "MEMORY",
            "Gathering virtual memory statistics",
            "running"
        )
        vm = psutil.virtual_memory()
        self._log_command(
            "psutil.virtual_memory()",
            "MEMORY",
            "Gathering virtual memory statistics",
            "success",
            f"Total: {vm.total / (1024**3):.2f} GB, Used: {vm.percent}%, Available: {vm.available / (1024**3):.2f} GB"
        )
        
        self._log_command(
            "psutil.swap_memory()",
            "MEMORY",
            "Gathering swap/PageFile statistics",
            "running"
        )
        swap = psutil.swap_memory()
        self._log_command(
            "psutil.swap_memory()",
            "MEMORY",
            "Gathering swap/PageFile statistics",
            "success",
            f"Total: {swap.total / (1024**3):.2f} GB, Used: {swap.percent}%, Used bytes: {swap.used}"
        )
        
        # Step 5: Disk Info
        self._log_command(
            "psutil.disk_partitions()",
            "DISK",
            "Enumerating disk partitions",
            "running"
        )
        partitions = psutil.disk_partitions(all=False)
        self._log_command(
            "psutil.disk_partitions()",
            "DISK",
            "Enumerating disk partitions",
            "success",
            f"Found {len(partitions)} partitions"
        )
        
        disk_info = []
        for part in partitions:
            self._log_command(
                f"psutil.disk_usage('{part.mountpoint}')",
                "DISK",
                f"Measuring disk usage for {part.device}",
                "running"
            )
            try:
                usage = psutil.disk_usage(part.mountpoint)
                disk_info.append({
                    "device": part.device,
                    "mountpoint": part.mountpoint,
                    "fstype": part.fstype,
                    "total_bytes": usage.total,
                    "used_bytes": usage.used,
                    "free_bytes": usage.free,
                    "percent_used": usage.percent
                })
                self._log_command(
                    f"psutil.disk_usage('{part.mountpoint}')",
                    "DISK",
                    f"Measuring disk usage for {part.device}",
                    "success",
                    f"Used: {usage.used / (1024**3):.2f} GB / {usage.total / (1024**3):.2f} GB ({usage.percent}%)"
                )
            except PermissionError as e:
                self._log_command(
                    f"psutil.disk_usage('{part.mountpoint}')",
                    "DISK",
                    f"Measuring disk usage for {part.device}",
                    "error",
                    "",
                    str(e)
                )
        
        # Step 6: Network I/O
        self._log_command(
            "psutil.net_io_counters()",
            "NETWORK",
            "Gathering network I/O statistics",
            "running"
        )
        net_io = psutil.net_io_counters()
        self._log_command(
            "psutil.net_io_counters()",
            "NETWORK",
            "Gathering network I/O statistics",
            "success",
            f"Bytes sent: {net_io.bytes_sent}, Bytes received: {net_io.bytes_recv}"
        )
        
        # Step 7: Process List
        self._log_command(
            "psutil.process_iter()",
            "PROCESS",
            f"Enumerating top {MAX_PROCESSES} processes by memory usage",
            "running"
        )
        
        procs = []
        for p in psutil.process_iter(["pid", "ppid", "name", "username", "memory_info", "num_threads", "exe"]):
            try:
                info = p.info
                rss = float(info["memory_info"].rss) if info.get("memory_info") else 0.0
                procs.append((rss, {
                    "pid": info["pid"],
                    "ppid": info.get("ppid"),
                    "name": info.get("name"),
                    "username": info.get("username"),
                    "rss_bytes": int(rss),
                    "num_threads": info.get("num_threads"),
                    "exe": info.get("exe")
                }))
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        procs.sort(key=lambda x: x[0], reverse=True)
        top_procs = procs[:MAX_PROCESSES]
        
        proc_summary = "\n".join([
            f"  PID {p['pid']:6d} | {p['name']:30s} | {rss / (1024**2):8.2f} MB"
            for rss, p in top_procs[:10]
        ])
        
        self._log_command(
            "psutil.process_iter()",
            "PROCESS",
            f"Enumerating top {MAX_PROCESSES} processes by memory usage",
            "success",
            f"Total processes found: {len(procs)}\nTop 10 by memory:\n{proc_summary}"
        )
        
        # Step 8: Network Connections
        self._log_command(
            "psutil.net_connections()",
            "NETWORK",
            f"Enumerating network connections (limit: {MAX_CONNECTIONS})",
            "running"
        )
        
        conns = []
        connection_summary = []
        
        for c in psutil.net_connections(kind="inet"):
            if len(conns) >= MAX_CONNECTIONS:
                break
            try:
                laddr = f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else None
                raddr = f"{c.raddr.ip}:{c.raddr.port}" if c.raddr and c.raddr.ip else None
                
                conn_info = {
                    "fd": c.fd,
                    "family": str(c.family),
                    "type": str(c.type),
                    "local": laddr,
                    "remote": raddr,
                    "status": c.status,
                    "pid": c.pid
                }
                conns.append(conn_info)
                
                connection_summary.append(f"  {laddr or '*:*':25s} -> {raddr or '*:*':25s} [{c.status}] (PID: {c.pid})")
                
            except (OSError, ValueError):
                continue
        
        self._log_command(
            "psutil.net_connections()",
            "NETWORK",
            f"Enumerating network connections (limit: {MAX_CONNECTIONS})",
            "success",
            f"Total connections: {len(conns)}\n" + "\n".join(connection_summary[:20])
        )
        
        # Build final snapshot
        snapshot = {
            "schema": "groundtrace_windows_snapshot_v2",
            "session_id": self.session.session_id,
            "collected_at_utc": datetime.now(timezone.utc).isoformat(),
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
            "boot_time_utc": datetime.fromtimestamp(boot_time, tz=timezone.utc).isoformat(),
            "cpu": {
                "logical_cpus": logical_cpus,
                "physical_cpus": physical_cpus,
                "usage_percent_interval_0_5s": cpu_percent,
            },
            "memory": {
                "virtual": vm._asdict(),
                "swap": swap._asdict(),
            },
            "disks": disk_info,
            "network_io": net_io._asdict(),
            "processes": [p for _, p in top_procs],
            "network_connections": conns,
        }
        
        self.session.completed_at = datetime.now(timezone.utc).isoformat()
        self.session.final_snapshot = snapshot
        
        return snapshot
    
    def get_session_summary(self) -> dict:
        """Get summary of the collection session"""
        return {
            "session_id": self.session.session_id,
            "started_at": self.session.started_at,
            "completed_at": self.session.completed_at,
            "total_commands": self.session.total_commands,
            "successful_commands": self.session.successful_commands,
            "failed_commands": self.session.failed_commands,
            "commands": self.session.commands
        }


def snapshot_to_json(snapshot: dict[str, Any]) -> str:
    return json.dumps(snapshot, indent=2, default=str)


# Backward compatibility
def collect_snapshot(
    *,
    include_cmdline: bool = False,
    include_perf_counters: bool = True,
) -> dict[str, Any]:
    """Legacy function for backward compatibility"""
    collector = LoggingCollector()
    return collector.collect_full_telemetry()
