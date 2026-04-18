# backend/tests/test_marker_watcher.py
import asyncio
import json
from pathlib import Path

import pytest

from app.core.marker_watcher import MarkerWatcher


def _write(tmp: Path, phase: str, ended_at: str | None = None, run_id: str = "ral-1") -> Path:
    wd = tmp / "workdocs"
    wd.mkdir(exist_ok=True)
    p = wd / ".panoptica-run.json"
    p.write_text(
        json.dumps(
            {
                "run_id": run_id,
                "orchestrator_session_id": "orc-1",
                "primary_repo": str(tmp),
                "workdocs_dir": str(wd),
                "started_at": "2026-04-18T14:32:07Z",
                "ended_at": ended_at,
                "phase": phase,
                "model_config": {"coder": "claude-sonnet-4-6"},
            }
        )
    )
    return p


@pytest.mark.asyncio
async def test_watcher_emits_run_start(tmp_path, monkeypatch):
    monkeypatch.setenv("PANOPTICA_MARKER_POLL_INTERVAL", "0.05")
    events: list[tuple[str, dict]] = []

    async def cb(event_type: str, payload: dict) -> None:
        events.append((event_type, payload))

    w = MarkerWatcher(on_event=cb)
    _write(tmp_path, phase="A")
    w.register(tmp_path)
    await w.start()
    await asyncio.sleep(0.2)
    await w.stop()
    assert any(t == "run_start" for t, _ in events)


@pytest.mark.asyncio
async def test_watcher_emits_phase_change_and_end(tmp_path, monkeypatch):
    monkeypatch.setenv("PANOPTICA_MARKER_POLL_INTERVAL", "0.05")
    events: list[tuple[str, dict]] = []

    async def cb(event_type: str, payload: dict) -> None:
        events.append((event_type, payload))

    w = MarkerWatcher(on_event=cb)
    _write(tmp_path, phase="A")
    w.register(tmp_path)
    await w.start()
    await asyncio.sleep(0.15)
    _write(tmp_path, phase="B")
    await asyncio.sleep(0.15)
    _write(tmp_path, phase="B", ended_at="2026-04-18T16:00:00Z")
    await asyncio.sleep(0.15)
    await w.stop()

    types = [t for t, _ in events]
    assert "run_start" in types
    assert "run_phase_change" in types
    assert "run_end" in types


@pytest.mark.asyncio
async def test_watcher_ignores_missing_file(tmp_path, monkeypatch):
    monkeypatch.setenv("PANOPTICA_MARKER_POLL_INTERVAL", "0.05")
    events: list[tuple[str, dict]] = []

    async def cb(event_type: str, payload: dict) -> None:
        events.append((event_type, payload))

    w = MarkerWatcher(on_event=cb)
    w.register(tmp_path)  # no marker file written
    await w.start()
    await asyncio.sleep(0.15)
    await w.stop()
    assert events == []
