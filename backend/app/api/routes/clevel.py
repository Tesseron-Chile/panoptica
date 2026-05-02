"""C-Level routes: directive listing and Arquitecto trigger."""

from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.arquitecto import ArquitectoService
from app.db.database import get_db
from app.db.models import DirectiveRecord
from app.models.directives import DirectiveResponse

router = APIRouter(prefix="/floors/c_level", tags=["c_level"])

_arquitecto = ArquitectoService()


@router.get("/directives")
async def get_directives(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 20,
) -> list[DirectiveResponse]:
    """Return recent directives triggered from C-Level chat."""
    stmt = (
        select(DirectiveRecord)
        .order_by(DirectiveRecord.triggered_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [DirectiveResponse.model_validate(r) for r in result.scalars().all()]


@router.post("/arquitecto/trigger", status_code=202)
async def trigger_arquitecto() -> dict[str, Any]:
    """Manually trigger an El Arquitecto observation cycle."""
    await _arquitecto.run_observation_cycle()
    return {"triggered_at": datetime.now(UTC).isoformat(), "status": "launched"}
