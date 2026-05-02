"""Floor configuration and task trigger API."""

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.agent_runner import AgentRunner
from app.core.floor_config import get_building_config

router = APIRouter()

_runner = AgentRunner()


class TriggerTaskRequest(BaseModel):
    task: str | None = None


@router.get("/floors")
async def get_floors() -> dict[str, Any]:
    """Return the building floor configuration."""
    config = get_building_config()
    return config.model_dump()


@router.post("/floors/{floor_id}/tasks/trigger", status_code=202)
async def trigger_floor_task(
    floor_id: str,
    body: TriggerTaskRequest | None = None,
) -> dict[str, Any]:
    """Manually trigger a floor task without waiting for the cron schedule."""
    if body is None:
        body = TriggerTaskRequest()
    building = get_building_config()
    floor = building.get_floor(floor_id)
    if floor is None:
        raise HTTPException(status_code=404, detail=f"Floor '{floor_id}' not found")

    task = body.task or (
        floor.schedule.daily[0] if floor.schedule.daily else "estado del departamento"
    )

    await _runner.run_floor_task(
        floor_id=floor.id,
        task=task,
        mission=floor.mission or "",
        workdocs_dir=floor.workdocs_dir or f"workdocs/{floor.id}/",
    )

    return {"floor_id": floor_id, "task": task, "triggered_at": datetime.now(UTC).isoformat()}
