from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

PRIORITY_ORDER: dict[str, int] = {"critical": 0, "alert": 1, "info": 2, "report": 3}


class FloorUpdateCreate(BaseModel):
    priority: Literal["critical", "alert", "info", "report"]
    title: str
    body: str
    auto_expire_hours: int = 24


class FloorUpdateResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True, alias_generator=to_camel, populate_by_name=True
    )

    id: int
    floor_id: str
    priority: str
    title: str
    body: str
    timestamp: datetime
    auto_expire_hours: int
    resolved: bool


class FloorUpdatePatch(BaseModel):
    resolved: bool
