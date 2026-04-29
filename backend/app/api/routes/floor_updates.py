import logging
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import FloorUpdateRecord
from app.models.floor_updates import (
    PRIORITY_ORDER,
    FloorUpdateCreate,
    FloorUpdatePatch,
    FloorUpdateResponse,
)

logger = logging.getLogger(__name__)

floor_router = APIRouter(prefix="/floors", tags=["floor_updates"])
updates_router = APIRouter(prefix="/updates", tags=["floor_updates"])


def _is_expired(record: FloorUpdateRecord) -> bool:
    if record.priority == "critical":
        return False
    ts = record.timestamp
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=UTC)
    return datetime.now(UTC) > ts + timedelta(hours=record.auto_expire_hours)


@floor_router.post("/{floor_id}/updates")
async def create_floor_update(
    floor_id: str,
    body: FloorUpdateCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FloorUpdateResponse:
    record = FloorUpdateRecord(
        floor_id=floor_id,
        priority=body.priority,
        title=body.title,
        body=body.body,
        auto_expire_hours=body.auto_expire_hours,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return FloorUpdateResponse.model_validate(record)


@floor_router.get("/{floor_id}/updates")
async def get_floor_updates(
    floor_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    priority: str | None = None,
    include_expired: bool = False,
) -> list[FloorUpdateResponse]:
    stmt = select(FloorUpdateRecord).where(FloorUpdateRecord.floor_id == floor_id)
    if priority is not None:
        stmt = stmt.where(FloorUpdateRecord.priority == priority)
    stmt = stmt.order_by(FloorUpdateRecord.id.desc())
    result = await db.execute(stmt)
    records = list(result.scalars().all())
    if not include_expired:
        records = [r for r in records if not _is_expired(r)]
    return [FloorUpdateResponse.model_validate(r) for r in records]


@updates_router.get("/latest")
async def get_latest_updates(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 10,
) -> list[FloorUpdateResponse]:
    stmt = select(FloorUpdateRecord).order_by(FloorUpdateRecord.id.desc())
    result = await db.execute(stmt)
    records = list(result.scalars().all())
    active = [r for r in records if not _is_expired(r)]
    active.sort(key=lambda r: (PRIORITY_ORDER.get(r.priority, 99), -r.id))
    return [FloorUpdateResponse.model_validate(r) for r in active[:limit]]


@updates_router.patch("/{update_id}")
async def patch_floor_update(
    update_id: int,
    body: FloorUpdatePatch,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FloorUpdateResponse:
    record = await db.get(FloorUpdateRecord, update_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Update not found")
    record.resolved = body.resolved
    await db.commit()
    await db.refresh(record)
    return FloorUpdateResponse.model_validate(record)
