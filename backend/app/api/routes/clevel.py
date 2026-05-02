"""C-Level routes: directive listing, Arquitecto trigger, and proposals."""

from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.arquitecto import ArquitectoService
from app.db.database import get_db
from app.db.models import DirectiveRecord
from app.models.directives import DirectiveResponse
from app.models.proposals import ProposalResponse

router = APIRouter(prefix="/floors/c_level", tags=["c_level"])

_arquitecto = ArquitectoService()
_PROPOSALS_DIR = (
    Path(__file__).parent.parent.parent.parent.parent / "vault" / "c_level" / "propuestas"
)


def _read_proposals() -> list[ProposalResponse]:
    if not _PROPOSALS_DIR.exists():
        return []
    proposals: list[ProposalResponse] = []
    for path in sorted(_PROPOSALS_DIR.glob("*.md"), reverse=True):
        text = path.read_text(encoding="utf-8")
        first_line = text.splitlines()[0] if text.strip() else path.stem
        title = first_line.lstrip("# ").strip() or path.stem
        stat = path.stat()
        proposals.append(
            ProposalResponse(
                filename=path.name,
                title=title,
                content=text,
                created_at=datetime.fromtimestamp(stat.st_mtime, tz=UTC),
            )
        )
    return proposals


@router.get("/directives")
async def get_directives(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 20,
) -> list[DirectiveResponse]:
    """Return recent directives triggered from C-Level chat."""
    stmt = select(DirectiveRecord).order_by(DirectiveRecord.triggered_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return [DirectiveResponse.model_validate(r) for r in result.scalars().all()]


@router.get("/proposals")
async def get_proposals() -> list[ProposalResponse]:
    """List pending Arquitecto proposals from vault/c_level/propuestas/."""
    return _read_proposals()


@router.delete("/proposals/{filename}", status_code=204)
async def reject_proposal(filename: str) -> None:
    """Reject (delete) an Arquitecto proposal file."""
    if "/" in filename or "\\" in filename or not filename.endswith(".md"):
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = _PROPOSALS_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Proposal not found")
    path.unlink()


@router.post("/arquitecto/trigger", status_code=202)
async def trigger_arquitecto() -> dict[str, Any]:
    """Manually trigger an El Arquitecto observation cycle."""
    await _arquitecto.run_observation_cycle()
    return {"triggered_at": datetime.now(UTC).isoformat(), "status": "launched"}
