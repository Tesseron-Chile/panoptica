from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ChatMessageCreate(BaseModel):
    sender: str = Field(max_length=200)
    role: Literal["user", "agent", "system"]
    content: str = Field(max_length=10000)


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True, alias_generator=to_camel, populate_by_name=True
    )

    id: int
    floor_id: str
    sender: str
    role: str
    content: str
    timestamp: datetime
