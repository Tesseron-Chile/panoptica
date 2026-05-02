"""Floor and building configuration loader.

Reads ``floors.toml`` to define the building hierarchy:
Building > Floor > Room.  Each floor maps to a department,
each room maps to a repository.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

import tomli
from pydantic import BaseModel, Field

__all__ = [
    "RoomConfig",
    "FloorSchedule",
    "FloorConfig",
    "BuildingConfig",
    "load_building_config",
    "get_building_config",
]

logger = logging.getLogger(__name__)

DEFAULT_TOML_PATH = Path(__file__).parent.parent.parent / "floors.toml"


class RoomConfig(BaseModel):
    """A single room (repository) on a floor."""

    id: str
    repo_name: str


class FloorSchedule(BaseModel):
    """Daily, weekly, and interval task schedule for a floor."""

    daily: list[str] = Field(default_factory=list)
    weekly: list[str] = Field(default_factory=list)
    every_30min: list[str] = Field(default_factory=list)


class FloorConfig(BaseModel):
    """A single floor (department) in the building."""

    id: str = ""
    name: str
    floor_number: int
    accent: str
    icon: str
    rooms: list[RoomConfig] = Field(default_factory=list)
    mission: str = ""
    workdocs_dir: str = ""
    schedule: FloorSchedule = Field(default_factory=FloorSchedule)
    is_c_level: bool = False
    knowledge_vault: str = ""
    inbox_email: str = ""
    gmail_label: str = ""
    linear_project: str = ""


class BuildingConfig(BaseModel):
    """Top-level building configuration."""

    building_name: str = "Building"
    floors: list[FloorConfig] = Field(default_factory=list)

    def get_floor(self, floor_id: str) -> FloorConfig | None:
        """Look up a floor by its id."""
        return next((f for f in self.floors if f.id == floor_id), None)

    def find_room(self, repo_name: str) -> tuple[FloorConfig, RoomConfig] | None:
        """Find which floor and room a repo belongs to."""
        for floor in self.floors:
            for room in floor.rooms:
                if room.repo_name == repo_name:
                    return floor, room
        return None


def load_building_config(
    *,
    toml_path: Path | None = None,
    toml_string: str | None = None,
) -> BuildingConfig:
    """Load building config from a TOML file or string."""
    raw: dict[str, Any] = {}

    if toml_string is not None:
        raw = tomli.loads(toml_string)
    elif toml_path is not None:
        if not toml_path.exists():
            logger.warning("floors.toml not found at %s — using empty config", toml_path)
            return BuildingConfig()
        raw = tomli.loads(toml_path.read_text(encoding="utf-8"))

    floors: list[FloorConfig] = []
    for entry in raw.get("floors", []):
        entry_dict: dict[str, Any] = entry
        name = str(entry_dict["name"])
        floor_id = str(entry_dict.get("id", name.lower().replace(" ", "")))
        rooms: list[RoomConfig] = [
            RoomConfig(id=str(r), repo_name=str(r)) for r in entry_dict.get("repos", [])
        ]
        raw_schedule = entry_dict.get("schedule", {})
        floors.append(
            FloorConfig(
                id=floor_id,
                name=name,
                floor_number=int(entry_dict["floor_number"]),
                accent=str(entry_dict["accent"]),
                icon=str(entry_dict["icon"]),
                rooms=rooms,
                mission=str(entry_dict.get("mission", "")),
                workdocs_dir=str(entry_dict.get("workdocs_dir", "")),
                schedule=FloorSchedule(**raw_schedule),
                is_c_level=bool(entry_dict.get("is_c_level", False)),
                knowledge_vault=str(entry_dict.get("knowledge_vault", "")),
                inbox_email=str(entry_dict.get("inbox_email", "")),
                gmail_label=str(entry_dict.get("gmail_label", "")),
                linear_project=str(entry_dict.get("linear_project", "")),
            )
        )

    floors.sort(key=lambda f: f.floor_number, reverse=True)
    return BuildingConfig(
        building_name=str(raw.get("building_name", "Building")),
        floors=floors,
    )


@lru_cache(maxsize=1)
def get_building_config() -> BuildingConfig:
    """Return the cached building configuration singleton."""
    return load_building_config(toml_path=DEFAULT_TOML_PATH)
