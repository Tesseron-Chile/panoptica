import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import ChatMessageRecord
from app.models.chat import ChatMessageCreate, ChatMessageResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/floors", tags=["chat"])


@router.post("/{floor_id}/chat")
async def create_chat_message(
    floor_id: str,
    body: ChatMessageCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatMessageResponse:
    record = ChatMessageRecord(
        floor_id=floor_id,
        sender=body.sender,
        role=body.role,
        content=body.content,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return ChatMessageResponse.model_validate(record)


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
