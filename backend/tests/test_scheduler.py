"""Tests for FloorScheduler job registration."""

from unittest.mock import AsyncMock, patch

import pytest

from app.core.floor_config import FloorConfig, FloorSchedule
from app.core.scheduler import FloorScheduler


def _make_floor(floor_id: str, daily: list[str], weekly: list[str]) -> FloorConfig:
    return FloorConfig(
        id=floor_id,
        name=floor_id.replace("_", " ").title(),
        floor_number=1,
        accent="#ffffff",
        icon="🏢",
        schedule=FloorSchedule(daily=daily, weekly=weekly),
        mission="Test mission",
        workdocs_dir=f"workdocs/{floor_id}/",
    )


def test_scheduler_registers_daily_jobs():
    floors = [
        _make_floor("dev_software", daily=["task1", "task2"], weekly=[]),
        _make_floor("mkt_ventas", daily=["task3"], weekly=[]),
    ]
    scheduler = FloorScheduler(floors=floors)
    # 2 daily tasks for dev_software + 1 for mkt_ventas = 3 jobs
    assert scheduler.job_count() == 3


def test_scheduler_registers_weekly_jobs():
    floors = [
        _make_floor("dev_software", daily=[], weekly=["weekly1", "weekly2"]),
    ]
    scheduler = FloorScheduler(floors=floors)
    assert scheduler.job_count() == 2


def test_scheduler_skips_floors_with_no_schedule():
    floors = [
        _make_floor("c_level", daily=[], weekly=[]),
        _make_floor("dev_software", daily=["task1"], weekly=[]),
    ]
    scheduler = FloorScheduler(floors=floors)
    assert scheduler.job_count() == 1


def test_scheduler_skips_is_c_level_floor():
    c_level = FloorConfig(
        id="c_level",
        name="C Level",
        floor_number=99,
        accent="#8b5cf6",
        icon="👑",
        schedule=FloorSchedule(daily=["ceo_briefing"], weekly=["board_review"]),
        mission="Strategic oversight",
        workdocs_dir="workdocs/c_level/",
        is_c_level=True,
    )
    dev = _make_floor("dev_software", daily=["task1"], weekly=[])
    scheduler = FloorScheduler(floors=[c_level, dev])
    # c_level schedule tasks are skipped; instead gets 1 Arquitecto weekly job
    # dev_software adds 1 daily job → total 2
    assert scheduler.job_count() == 2


def test_scheduler_start_and_stop():
    floors = [_make_floor("dev_software", daily=["t1"], weekly=[])]
    scheduler = FloorScheduler(floors=floors)

    with (
        patch.object(scheduler._scheduler, "start") as mock_start,
        patch.object(scheduler._scheduler, "shutdown") as mock_shutdown,
    ):
        scheduler.start()
        mock_start.assert_called_once()
        scheduler.stop()
        mock_shutdown.assert_called_once_with(wait=False)


@pytest.mark.asyncio
async def test_scheduler_calls_agent_runner_on_trigger():
    floors = [_make_floor("dev_software", daily=["revisar PRs"], weekly=[])]
    mock_runner = AsyncMock()
    scheduler = FloorScheduler(floors=floors, agent_runner=mock_runner)

    await scheduler._trigger_task(
        floor_id="dev_software",
        task="revisar PRs",
        mission="Test mission",
        workdocs_dir="workdocs/dev_software/",
    )

    mock_runner.run_floor_task.assert_called_once_with(
        floor_id="dev_software",
        task="revisar PRs",
        mission="Test mission",
        workdocs_dir="workdocs/dev_software/",
    )
