"""FloorScheduler — registers daily/weekly cron jobs per floor.

Uses APScheduler 3.x with AsyncIOScheduler so jobs run on the existing
FastAPI event loop without spawning extra threads.

Jobs call AgentRunner.run_floor_task, which fires a Claude Code CLI
subprocess that the existing hooks route back to the correct floor.
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.agent_runner import AgentRunner
from app.core.floor_config import FloorConfig

logger = logging.getLogger(__name__)

# Daily jobs fire at 09:00 local time; weekly jobs fire Mondays at 09:00.
_DAILY_CRON = {"hour": 9, "minute": 0}
_WEEKLY_CRON = {"day_of_week": "mon", "hour": 9, "minute": 0}


class FloorScheduler:
    """Manages scheduled autonomous agent tasks for all floors."""

    def __init__(
        self,
        floors: list[FloorConfig],
        agent_runner: AgentRunner | None = None,
    ) -> None:
        self._runner = agent_runner or AgentRunner()
        self._scheduler = AsyncIOScheduler()
        self._job_count = 0
        self._register_jobs(floors)

    def _register_jobs(self, floors: list[FloorConfig]) -> None:
        for floor in floors:
            if floor.is_c_level:
                continue
            for task in floor.schedule.daily:
                self._scheduler.add_job(
                    self._trigger_task,
                    CronTrigger(**_DAILY_CRON),
                    args=[floor.id, task, floor.mission, floor.workdocs_dir],
                    id=f"{floor.id}__daily__{self._job_count}",
                )
                self._job_count += 1
            for task in floor.schedule.weekly:
                self._scheduler.add_job(
                    self._trigger_task,
                    CronTrigger(**_WEEKLY_CRON),
                    args=[floor.id, task, floor.mission, floor.workdocs_dir],
                    id=f"{floor.id}__weekly__{self._job_count}",
                )
                self._job_count += 1

    def job_count(self) -> int:
        """Return the number of registered cron jobs."""
        return self._job_count

    def start(self) -> None:
        """Start the scheduler. Call once during FastAPI lifespan startup."""
        self._scheduler.start()
        logger.info("FloorScheduler started with %d jobs", self._job_count)

    def stop(self) -> None:
        """Stop the scheduler gracefully. Call during FastAPI lifespan shutdown."""
        self._scheduler.shutdown(wait=False)
        logger.info("FloorScheduler stopped")

    async def _trigger_task(
        self,
        floor_id: str,
        task: str,
        mission: str,
        workdocs_dir: str,
    ) -> None:
        """Called by APScheduler to run a single floor task."""
        logger.info("FloorScheduler: triggering task=%r floor=%r", task, floor_id)
        await self._runner.run_floor_task(
            floor_id=floor_id,
            task=task,
            mission=mission,
            workdocs_dir=workdocs_dir,
        )
