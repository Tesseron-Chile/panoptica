from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.websocket import manager
from app.core.agent_runner import AgentRunner
from app.core.directive_parser import parse_directive
from app.core.floor_config import get_building_config
from app.db.database import get_db
from app.db.models import ChatMessageRecord, DirectiveRecord
from app.models.chat import ChatMessageCreate, ChatMessageResponse

router = APIRouter(prefix="/floors", tags=["chat"])

_runner = AgentRunner()
_C_LEVEL_ID = "c_level"


async def _save_and_broadcast(
    db: AsyncSession,
    floor_id: str,
    sender: str,
    role: str,
    content: str,
) -> ChatMessageResponse:
    record = ChatMessageRecord(floor_id=floor_id, sender=sender, role=role, content=content)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    response = ChatMessageResponse.model_validate(record)
    await manager.broadcast_floor(
        {
            "type": "chat_message",
            "floor_id": floor_id,
            "message": response.model_dump(mode="json", by_alias=True),
        },
        floor_id,
    )
    return response


@router.post("/{floor_id}/chat")
async def create_chat_message(
    floor_id: str,
    body: ChatMessageCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatMessageResponse:
    response = await _save_and_broadcast(db, floor_id, body.sender, body.role, body.content)

    # Directive detection — only for c_level user messages with @floor_id: syntax
    if floor_id == _C_LEVEL_ID and body.role == "user":
        directive = parse_directive(body.content)
        if directive is not None:
            building = get_building_config()
            target_floor = building.get_floor(directive.floor_id)
            if target_floor is not None:
                db.add(
                    DirectiveRecord(
                        floor_id=directive.floor_id,
                        instruction=directive.instruction,
                        triggered_by=body.sender,
                    )
                )
                await db.commit()

                await _runner.run_floor_task(
                    floor_id=target_floor.id,
                    task=directive.instruction,
                    mission=target_floor.mission or "",
                    workdocs_dir=target_floor.workdocs_dir or f"vault/{target_floor.id}/",
                )

                await _save_and_broadcast(
                    db,
                    _C_LEVEL_ID,
                    sender="sistema",
                    role="system",
                    content=f"✓ Directiva enviada a {directive.floor_id}: {directive.instruction}",
                )
            else:
                await _save_and_broadcast(
                    db,
                    _C_LEVEL_ID,
                    sender="sistema",
                    role="system",
                    content=f"⚠ Piso desconocido: @{directive.floor_id}",
                )

    return response


@router.get("/{floor_id}/chat")
async def get_chat_messages(
    floor_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 50,
    before: int | None = None,
) -> list[ChatMessageResponse]:
    stmt = select(ChatMessageRecord).where(ChatMessageRecord.floor_id == floor_id)
    if before is not None:
        stmt = stmt.where(ChatMessageRecord.id < before)
    stmt = stmt.order_by(ChatMessageRecord.id.desc()).limit(limit)
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [ChatMessageResponse.model_validate(r) for r in records]
