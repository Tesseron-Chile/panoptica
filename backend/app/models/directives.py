from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class DirectiveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)

    id: int
    floor_id: str
    instruction: str
    triggered_by: str
    status: str
    triggered_at: datetime
