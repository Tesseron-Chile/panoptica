"""Tests for CS-specific FloorSchedule and FloorConfig extensions."""

from app.core.floor_config import FloorConfig, FloorSchedule, load_building_config

CS_TOML = """
[[floors]]
id = "cs"
name = "Customer Service"
floor_number = 3
accent = "#10b981"
icon = "🎧"
mission = "Atender clientes"
workdocs_dir = "workdocs/customer_service/"
knowledge_vault = "vault/customer_service/"
inbox_email = "prometeo@tesseron.cl"
gmail_label = "cs-procesado"
linear_project = "Prometeo"
schedule.every_30min = ["revisar inbox prometeo@tesseron.cl"]
schedule.daily = ["reporte de casos del día"]

[[floors]]
id = "legacy"
name = "Legacy"
floor_number = 1
accent = "#aaa"
icon = "📦"
"""


# --- FloorSchedule ---


def test_floor_schedule_every_30min_populated():
    sched = FloorSchedule(every_30min=["task1", "task2"])
    assert sched.every_30min == ["task1", "task2"]


def test_floor_schedule_every_30min_default():
    sched = FloorSchedule()
    assert sched.every_30min == []


def test_floor_schedule_existing_fields_unaffected():
    sched = FloorSchedule(daily=["d1"], weekly=["w1"], every_30min=["e1"])
    assert sched.daily == ["d1"]
    assert sched.weekly == ["w1"]
    assert sched.every_30min == ["e1"]


# --- FloorConfig ---


def test_floor_config_new_fields_populated():
    f = FloorConfig(
        name="Test",
        floor_number=1,
        accent="#fff",
        icon="x",
        knowledge_vault="vault/test/",
        inbox_email="a@b.com",
        gmail_label="processed",
        linear_project="Proj",
    )
    assert f.knowledge_vault == "vault/test/"
    assert f.inbox_email == "a@b.com"
    assert f.gmail_label == "processed"
    assert f.linear_project == "Proj"


def test_floor_config_new_fields_default_empty():
    f = FloorConfig(name="Test", floor_number=1, accent="#fff", icon="x")
    assert f.knowledge_vault == ""
    assert f.inbox_email == ""
    assert f.gmail_label == ""
    assert f.linear_project == ""


# --- load_building_config TOML parsing ---


def test_toml_parses_cs_floor_new_fields():
    cfg = load_building_config(toml_string=CS_TOML)
    cs = cfg.get_floor("cs")
    assert cs is not None
    assert cs.knowledge_vault == "vault/customer_service/"
    assert cs.inbox_email == "prometeo@tesseron.cl"
    assert cs.gmail_label == "cs-procesado"
    assert cs.linear_project == "Prometeo"


def test_toml_parses_every_30min_schedule():
    cfg = load_building_config(toml_string=CS_TOML)
    cs = cfg.get_floor("cs")
    assert cs is not None
    assert cs.schedule.every_30min == ["revisar inbox prometeo@tesseron.cl"]
    assert cs.schedule.daily == ["reporte de casos del día"]


def test_toml_backward_compat_missing_new_fields():
    cfg = load_building_config(toml_string=CS_TOML)
    legacy = cfg.get_floor("legacy")
    assert legacy is not None
    assert legacy.knowledge_vault == ""
    assert legacy.inbox_email == ""
    assert legacy.gmail_label == ""
    assert legacy.linear_project == ""
    assert legacy.schedule.every_30min == []
