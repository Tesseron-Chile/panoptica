"""Tests for FloorScheduler every_30min IntervalTrigger support."""

from unittest.mock import AsyncMock

from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.core.floor_config import FloorConfig, FloorSchedule
from app.core.scheduler import FloorScheduler


def _make_floor(
    floor_id: str,
    every_30min: list[str] | None = None,
    daily: list[str] | None = None,
    weekly: list[str] | None = None,
) -> FloorConfig:
    return FloorConfig(
        id=floor_id,
        name=floor_id.capitalize(),
        floor_number=1,
        accent="#000",
        icon="x",
        mission="test mission",
        workdocs_dir=f"workdocs/{floor_id}/",
        schedule=FloorSchedule(
            every_30min=every_30min or [],
            daily=daily or [],
            weekly=weekly or [],
        ),
    )


def _get_scheduler(floors: list[FloorConfig]) -> FloorScheduler:
    return FloorScheduler(floors, agent_runner=AsyncMock())


# --- every_30min job registration ---


def test_every_30min_registers_correct_job_count():
    floor = _make_floor("cs", every_30min=["task1", "task2"])
    s = _get_scheduler([floor])
    assert s.job_count() == 2


def test_every_30min_uses_interval_trigger():
    floor = _make_floor("cs", every_30min=["task1"])
    s = _get_scheduler([floor])
    jobs = s._scheduler.get_jobs()
    interval_jobs = [j for j in jobs if isinstance(j.trigger, IntervalTrigger)]
    assert len(interval_jobs) == 1


def test_every_30min_does_not_use_cron_trigger():
    floor = _make_floor("cs", every_30min=["task1"])
    s = _get_scheduler([floor])
    jobs = s._scheduler.get_jobs()
    cron_jobs = [j for j in jobs if isinstance(j.trigger, CronTrigger)]
    assert len(cron_jobs) == 0


def test_no_every_30min_registers_zero_interval_jobs():
    floor = _make_floor("cs", daily=["report"], weekly=["review"])
    s = _get_scheduler([floor])
    jobs = s._scheduler.get_jobs()
    interval_jobs = [j for j in jobs if isinstance(j.trigger, IntervalTrigger)]
    assert len(interval_jobs) == 0


def test_mixed_schedule_counts_all_jobs():
    floor = _make_floor("cs", every_30min=["inbox"], daily=["report"], weekly=["retro"])
    s = _get_scheduler([floor])
    assert s.job_count() == 3


def test_mixed_schedule_interval_trigger_for_every_30min_only():
    floor = _make_floor("cs", every_30min=["inbox"], daily=["report"], weekly=["retro"])
    s = _get_scheduler([floor])
    jobs = s._scheduler.get_jobs()
    interval_jobs = [j for j in jobs if isinstance(j.trigger, IntervalTrigger)]
    cron_jobs = [j for j in jobs if isinstance(j.trigger, CronTrigger)]
    assert len(interval_jobs) == 1
    assert len(cron_jobs) == 2


def test_interval_trigger_fires_every_30_minutes():
    floor = _make_floor("cs", every_30min=["inbox"])
    s = _get_scheduler([floor])
    jobs = s._scheduler.get_jobs()
    interval_jobs = [j for j in jobs if isinstance(j.trigger, IntervalTrigger)]
    assert len(interval_jobs) == 1
    # APScheduler IntervalTrigger stores interval as a timedelta
    import datetime

    assert interval_jobs[0].trigger.interval == datetime.timedelta(minutes=30)


def test_every_30min_job_id_format():
    floor = _make_floor("cs", every_30min=["inbox check"])
    s = _get_scheduler([floor])
    jobs = s._scheduler.get_jobs()
    interval_jobs = [j for j in jobs if isinstance(j.trigger, IntervalTrigger)]
    assert len(interval_jobs) == 1
    assert "cs__every_30min__" in interval_jobs[0].id


def test_empty_floors_registers_no_jobs():
    floor = _make_floor("empty")
    s = _get_scheduler([floor])
    assert s.job_count() == 0


def test_multiple_floors_each_with_every_30min():
    floor1 = _make_floor("cs", every_30min=["inbox"])
    floor2 = _make_floor("support", every_30min=["poll", "check"])
    s = _get_scheduler([floor1, floor2])
    assert s.job_count() == 3
    jobs = s._scheduler.get_jobs()
    interval_jobs = [j for j in jobs if isinstance(j.trigger, IntervalTrigger)]
    assert len(interval_jobs) == 3
