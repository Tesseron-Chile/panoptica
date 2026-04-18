"""Regression tests: _handle_marker_event must call upsert_from_marker for
run_start, run_phase_change, and run_end — not just run_start.
"""
from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from app.core.event_processor import EventProcessor
from app.core.run_aggregator import RunAggregator
from app.models.runs import RunOutcome, RunPhase


def _write_marker(
    tmp: Path,
    *,
    phase: str,
    ended_at: str | None = None,
    run_id: str = "ral-42",
) -> None:
    wd = tmp / "workdocs"
    wd.mkdir(exist_ok=True)
    (wd / ".panoptica-run.json").write_text(
        json.dumps(
            {
                "run_id": run_id,
                "orchestrator_session_id": "orc-1",
                "primary_repo": str(tmp),
                "workdocs_dir": str(wd),
                "started_at": "2026-04-18T14:00:00Z",
                "ended_at": ended_at,
                "phase": phase,
                "model_config": {"coder": "claude-sonnet-4-6"},
            }
        )
    )


@pytest.mark.asyncio
@patch("app.core.event_processor.get_plan_watcher", return_value=None)
@patch.object(EventProcessor, "process_event", new_callable=AsyncMock)
async def test_all_three_marker_events_reach_aggregator(
    mock_pe: AsyncMock,
    _mock_pw,
    tmp_path: Path,
    monkeypatch,
) -> None:
    """run_start, run_phase_change, and run_end must each call upsert_from_marker."""
    monkeypatch.setenv("HOME", str(tmp_path))
    ep = EventProcessor()
    agg = RunAggregator()
    ep._run_aggregator = agg

    upsert_calls: list[str] = []
    original_upsert = agg.upsert_from_marker

    def _spy(marker):
        upsert_calls.append(marker.run_id)
        return original_upsert(marker)

    agg.upsert_from_marker = _spy  # type: ignore[method-assign]

    repo = str(tmp_path)
    wd = str(tmp_path / "workdocs")
    base_payload = {
        "run_id": "ral-42",
        "orchestrator_session_id": "orc-1",
        "primary_repo": repo,
        "workdocs_dir": wd,
        "model_config": {"coder": "claude-sonnet-4-6"},
    }

    # --- run_start ---
    _write_marker(tmp_path, phase="A")
    await ep._handle_marker_event("run_start", {**base_payload, "phase": "A"})

    # --- run_phase_change ---
    _write_marker(tmp_path, phase="B")
    await ep._handle_marker_event(
        "run_phase_change",
        {**base_payload, "phase": "B", "from_phase": "A"},
    )

    # --- run_end ---
    _write_marker(tmp_path, phase="B", ended_at="2026-04-18T16:00:00Z")
    await ep._handle_marker_event("run_end", {**base_payload, "phase": "B"})

    assert len(upsert_calls) == 3, (
        f"Expected upsert_from_marker called 3 times, got {len(upsert_calls)}"
    )

    run = agg.get("ral-42")
    assert run is not None
    assert run.phase == RunPhase.B
    assert run.ended_at is not None
    assert run.outcome == RunOutcome.COMPLETED
