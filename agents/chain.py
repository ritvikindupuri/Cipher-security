from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, TextIO

_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


def _get_client():
    use_openrouter = os.environ.get("USE_OPENROUTER", "").lower() in ("1", "true", "yes")
    
    if use_openrouter:
        from openai import OpenAI
        return OpenAI(
            api_key=os.environ.get("OPENROUTER_API_KEY"),
            base_url=os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        ), "openrouter"
    else:
        from anthropic import Anthropic
        return Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY")), "anthropic"


def _load_prompt(name: str) -> str:
    return (_PROMPTS_DIR / name).read_text(encoding="utf-8").strip()


def _text_from_anthropic(msg: Any) -> str:
    parts: list[str] = []
    for block in msg.content:
        if block.type == "text":
            parts.append(block.text)
    return "\n".join(parts).strip()


def _text_from_openai(msg: Any) -> str:
    return msg.choices[0].message.content.strip()


def _call_blocking(
    client: Any,
    provider: str,
    *,
    model: str,
    system: str,
    user_text: str,
    max_tokens: int = 4096,
) -> str:
    if provider == "anthropic":
        msg = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user_text}],
        )
        return _text_from_anthropic(msg)
    else:
        msg = client.chat.completions.create(
            model=model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_text},
            ],
        )
        return _text_from_openai(msg)


def _call_streaming(
    client: Any,
    provider: str,
    *,
    model: str,
    system: str,
    user_text: str,
    max_tokens: int = 4096,
    out: TextIO | None = None,
    callback: Callable[[str], None] | None = None,
) -> str:
    chunks: list[str] = []
    
    def _safe_write(text: str) -> None:
        try:
            if out:
                out.write(text)
                out.flush()
        except (UnicodeEncodeError, AttributeError):
            pass
    
    if provider == "anthropic":
        with client.messages.stream(
            model=model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user_text}],
        ) as stream:
            for text in stream.text_stream:
                chunks.append(text)
                _safe_write(text)
                if callback:
                    callback(text)
    else:
        stream = client.chat.completions.create(
            model=model,
            max_tokens=max_tokens,
            stream=True,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_text},
            ],
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                text = chunk.choices[0].delta.content
                chunks.append(text)
                _safe_write(text)
                if callback:
                    callback(text)
    return "".join(chunks).strip()


@dataclass
class ChainResult:
    telemetry_json: str
    agent1_facts: str
    agent2_mapping: str
    agent3_scenario: str
    model: str


def run_claude_chain(
    snapshot: dict[str, Any],
    *,
    stream: bool = True,
    out: TextIO | None = None,
    err: TextIO | None = None,
    on_agent_chunk: Callable[[str, str], None] | None = None,
) -> ChainResult:
    """
    Run three agents in order. If stream=True, each agent's reply is written to `out` as tokens arrive.
    Supports both Anthropic and OpenRouter providers.
    
    Args:
        on_agent_chunk: Optional callback(agent_id, chunk) called for each streaming chunk
    """
    out = out or sys.stdout
    err = err or sys.stderr

    use_openrouter = os.environ.get("USE_OPENROUTER", "").lower() in ("1", "true", "yes")
    
    if use_openrouter:
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            raise RuntimeError(
                "OPENROUTER_API_KEY is not set. Set USE_OPENROUTER=1 and add your key to .env"
            )
        model = os.environ.get("OPENROUTER_MODEL", "deepseek/deepseek-chat-v3")
    else:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key."
            )
        model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")

    telemetry_json = json.dumps(snapshot, indent=2, default=str)

    client, provider = _get_client()

    sys1 = _load_prompt("agent1_facts.txt")
    sys2 = _load_prompt("agent2_attack_surface.txt")
    sys3 = _load_prompt("agent3_scenario.txt")

    u1 = (
        "Windows telemetry snapshot (JSON). Summarize observed facts only.\n\n"
        f"```json\n{telemetry_json}\n```"
    )

    def _safe_write(text: str, stream: TextIO) -> None:
        try:
            stream.write(text)
        except UnicodeEncodeError:
            stream.buffer.write(text.encode('utf-8', errors='replace'))
            stream.buffer.flush()

    def run_agent(
        label: str, agent_id: str, system: str, user_text: str
    ) -> str:
        err.write(f"\n{'=' * 60}\n{label}\n{'=' * 60}\n")
        err.flush()
        if stream:
            out.write("\n")
            out.flush()
            
            def callback(chunk: str):
                if on_agent_chunk:
                    on_agent_chunk(agent_id, chunk)
            
            return _call_streaming(
                client, provider, model=model, system=system, user_text=user_text, out=out, callback=callback
            )
        text = _call_blocking(
            client, provider, model=model, system=system, user_text=user_text
        )
        _safe_write(text + "\n", out)
        out.flush()
        if on_agent_chunk:
            on_agent_chunk(agent_id, text)
        return text

    agent1 = run_agent(
        "Agent 1 — Telemetry analyst (live output below)",
        "agent1",
        sys1,
        u1,
    )

    u2 = (
        "Agent 1 summary:\n\n"
        f"{agent1}\n\n"
        "Original telemetry JSON (authoritative; do not invent beyond this):\n\n"
        f"```json\n{telemetry_json}\n```"
    )
    agent2 = run_agent(
        "Agent 2 — Attack-surface mapper (live output below)",
        "agent2",
        sys2,
        u2,
    )

    u3 = (
        "Agent 1 summary:\n\n"
        f"{agent1}\n\n"
        "Agent 2 analysis:\n\n"
        f"{agent2}\n\n"
        "Original telemetry JSON (authoritative):\n\n"
        f"```json\n{telemetry_json}\n```"
    )
    agent3 = run_agent(
        "Agent 3 — Tabletop scenario author (live output below)",
        "agent3",
        sys3,
        u3,
    )

    err.write("\n")
    err.flush()

    return ChainResult(
        telemetry_json=telemetry_json,
        agent1_facts=agent1,
        agent2_mapping=agent2,
        agent3_scenario=agent3,
        model=model,
    )
