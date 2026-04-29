"""Tests for extended FloorConfig fields (mission, workdocs_dir, schedule, is_c_level, explicit id)."""

from app.core.floor_config import FloorSchedule, FloorConfig, load_building_config

PROMETEO_TOML = """
building_name = "Prometeo"

[[floors]]
id = "dev_software"
name = "Desarrollo Software"
floor_number = 5
accent = "#3b82f6"
icon = "💻"
mission = "Construir y mantener el software de Prometeo"
workdocs_dir = "workdocs/dev_software/"
schedule.daily = ["revisar PRs abiertos", "correr suite de tests"]
schedule.weekly = ["reporte de deuda tecnica"]

[[floors]]
id = "c_level"
name = "C-Level"
floor_number = 99
accent = "#8b5cf6"
icon = "👔"
is_c_level = true
mission = "Vision, estrategia y mejora continua del sistema"
workdocs_dir = "workdocs/c_level/"

[[floors]]
name = "Legacy Floor"
floor_number = 1
accent = "#aaaaaa"
icon = "📦"
"""


def test_explicit_id_is_used():
    config = load_building_config(toml_string=PROMETEO_TOML)
    floor = config.get_floor("dev_software")
    assert floor is not None
    assert floor.id == "dev_software"


def test_generated_id_fallback():
    config = load_building_config(toml_string=PROMETEO_TOML)
    # "Legacy Floor" has no explicit id — should generate "legacyfloor"
    floor = config.get_floor("legacyfloor")
    assert floor is not None


def test_mission_field():
    config = load_building_config(toml_string=PROMETEO_TOML)
    floor = config.get_floor("dev_software")
    assert floor is not None
    assert floor.mission == "Construir y mantener el software de Prometeo"


def test_workdocs_dir_field():
    config = load_building_config(toml_string=PROMETEO_TOML)
    floor = config.get_floor("dev_software")
    assert floor is not None
    assert floor.workdocs_dir == "workdocs/dev_software/"


def test_schedule_daily():
    config = load_building_config(toml_string=PROMETEO_TOML)
    floor = config.get_floor("dev_software")
    assert floor is not None
    assert floor.schedule.daily == ["revisar PRs abiertos", "correr suite de tests"]


def test_schedule_weekly():
    config = load_building_config(toml_string=PROMETEO_TOML)
    floor = config.get_floor("dev_software")
    assert floor is not None
    assert floor.schedule.weekly == ["reporte de deuda tecnica"]


def test_schedule_empty_by_default():
    config = load_building_config(toml_string=PROMETEO_TOML)
    floor = config.get_floor("legacyfloor")
    assert floor is not None
    assert floor.schedule.daily == []
    assert floor.schedule.weekly == []


def test_is_c_level_flag():
    config = load_building_config(toml_string=PROMETEO_TOML)
    c = config.get_floor("c_level")
    assert c is not None
    assert c.is_c_level is True
    dev = config.get_floor("dev_software")
    assert dev is not None
    assert dev.is_c_level is False


def test_floor_schedule_model():
    sched = FloorSchedule(daily=["task1"], weekly=["task2"])
    assert sched.daily == ["task1"]
    assert sched.weekly == ["task2"]


def test_floor_schedule_defaults():
    sched = FloorSchedule()
    assert sched.daily == []
    assert sched.weekly == []
