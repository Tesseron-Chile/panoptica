import asyncio
from pathlib import Path

import pytest

from app.core.plan_watcher import PlanWatcher
from app.models.runs import PlanTaskStatus


@pytest.mark.asyncio
async def test_plan_watcher_fires_on_change(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("PANOPTICA_PLAN_POLL_INTERVAL", "0.05")
    plan = tmp_path / "PLAN.md"
    plan.write_text("- [ ] plan-task-1: first\n")

    updates: list[tuple[str, list]] = []

    async def cb(run_id: str, tasks) -> None:
        updates.append((run_id, list(tasks)))

    w = PlanWatcher(on_update=cb)
    w.register("ral-1", plan)
    await w.start()
    await asyncio.sleep(0.15)
    assert updates, "expected first update"
    assert updates[0][0] == "ral-1"
    assert updates[0][1][0].status == PlanTaskStatus.TODO

    plan.write_text("- [x] plan-task-1: first\n")
    await asyncio.sleep(0.2)
    await w.stop()

    statuses = [u[1][0].status for u in updates]
    assert PlanTaskStatus.DONE in statuses


@pytest.mark.asyncio
async def test_plan_watcher_no_file_is_noop(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("PANOPTICA_PLAN_POLL_INTERVAL", "0.05")
    updates: list = []

    async def cb(run_id: str, tasks) -> None:
        updates.append((run_id, tasks))

    w = PlanWatcher(on_update=cb)
    w.register("ral-1", tmp_path / "PLAN.md")
    await w.start()
    await asyncio.sleep(0.15)
    await w.stop()
    assert updates == []
