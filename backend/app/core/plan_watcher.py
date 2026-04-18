from __future__ import annotations

import asyncio
import contextlib
import hashlib
import logging
import os
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from pathlib import Path

from app.core.plan_parser import parse_plan_md
from app.models.runs import PlanTask

logger = logging.getLogger(__name__)

DEFAULT_POLL_INTERVAL_SECONDS = 1.0

PlanCallback = Callable[[str, list[PlanTask]], Awaitable[None]]


def _get_interval() -> float:
    try:
        return float(os.environ.get("PANOPTICA_PLAN_POLL_INTERVAL", str(DEFAULT_POLL_INTERVAL_SECONDS)))
    except ValueError:
        return DEFAULT_POLL_INTERVAL_SECONDS


@dataclass
class _PlanState:
    run_id: str
    path: Path
    last_hash: str = ""


class PlanWatcher:
    def __init__(self, on_update: PlanCallback) -> None:
        self._states: dict[str, _PlanState] = {}
        self._cb = on_update
        self._task: asyncio.Task[None] | None = None
        self._stopped = False

    def register(self, run_id: str, plan_path: Path) -> None:
        self._states[run_id] = _PlanState(run_id=run_id, path=Path(plan_path))

    def unregister(self, run_id: str) -> None:
        self._states.pop(run_id, None)

    async def start(self) -> None:
        if self._task:
            return
        self._stopped = False
        self._task = asyncio.create_task(self._loop(), name="plan_watcher")

    async def stop(self) -> None:
        self._stopped = True
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
            self._task = None

    async def _loop(self) -> None:
        try:
            while not self._stopped:
                for state in list(self._states.values()):
                    await self._poll_one(state)
                await asyncio.sleep(_get_interval())
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("plan_watcher loop crashed")

    async def _poll_one(self, state: _PlanState) -> None:
        if not state.path.exists():
            return
        try:
            content = state.path.read_text()
        except OSError as e:
            logger.debug("plan read failed for %s: %s", state.path, e)
            return
        h = hashlib.sha256(content.encode()).hexdigest()
        if h == state.last_hash:
            return
        state.last_hash = h
        tasks = parse_plan_md(content)
        try:
            await self._cb(state.run_id, tasks)
        except Exception:
            logger.exception("plan_watcher callback error for %s", state.run_id)
