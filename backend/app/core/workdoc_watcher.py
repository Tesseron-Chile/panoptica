"""WorkdocWatcher — polls floor workdoc directories for new agent outputs.

When a floor agent completes a task it writes a workdoc to
``workdocs/<floor_id>/YYYY-MM-DD-<task>.md``. This watcher detects new files
and triggers a boss-review AgentRunner session that reads the workdoc and
posts a FloorUpdate summary.
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from app.core.agent_runner import AgentRunner
from app.core.floor_config import FloorConfig

logger = logging.getLogger(__name__)

_POLL_INTERVAL = 60  # seconds


class WorkdocWatcher:
    """Polls workdoc directories for each floor and triggers boss review on new files."""

    def __init__(
        self,
        floors: list[FloorConfig],
        agent_runner: AgentRunner | None = None,
        repo_root: Path | None = None,
        poll_interval: int = _POLL_INTERVAL,
    ) -> None:
        self._runner = agent_runner or AgentRunner()
        self._poll_interval = poll_interval
        self._repo_root = repo_root or Path.cwd()
        self._seen: dict[str, set[Path]] = {}
        self._floors = [f for f in floors if not f.is_c_level]
        self._task: asyncio.Task[None] | None = None

        for floor in self._floors:
            self._seen[floor.id] = set()

    def start(self) -> None:
        self._task = asyncio.get_event_loop().create_task(self._poll_loop())
        logger.info("WorkdocWatcher started for %d floors", len(self._floors))

    def stop(self) -> None:
        if self._task:
            self._task.cancel()
            self._task = None
        logger.info("WorkdocWatcher stopped")

    async def _poll_loop(self) -> None:
        while True:
            await asyncio.sleep(self._poll_interval)
            for floor in self._floors:
                await self._check_floor(floor)

    async def _check_floor(self, floor: FloorConfig) -> None:
        workdocs_dir = self._repo_root / (floor.workdocs_dir or f"workdocs/{floor.id}/")
        if not workdocs_dir.exists():
            return

        current = set(workdocs_dir.glob("*.md"))
        new_files = current - self._seen[floor.id]
        self._seen[floor.id] = current

        for path in sorted(new_files):
            logger.info("WorkdocWatcher: new workdoc %s for floor %s", path.name, floor.id)
            await self._trigger_boss_review(floor, path)

    async def _trigger_boss_review(self, floor: FloorConfig, workdoc_path: Path) -> None:
        task = f"Revisa el workdoc {workdoc_path} y publica un floor update con el resumen"
        await self._runner.run_floor_task(
            floor_id=floor.id,
            task=task,
            mission=floor.mission or "",
            workdocs_dir=floor.workdocs_dir or f"workdocs/{floor.id}/",
        )
