"""Tests for floor-specific boss prompt loading (Run C-1)."""

import pytest

from app.core.agent_runner import _load_floor_prompt, build_floor_prompt

FLOORS_WITH_PROMPTS = [
    "dev_software",
    "dev_hardware",
    "customer_service",
    "financiero",
    "mkt_ventas",
]


@pytest.mark.parametrize("floor_id", FLOORS_WITH_PROMPTS)
def test_boss_prompt_file_exists(floor_id: str):
    content = _load_floor_prompt(floor_id)
    assert content is not None, f"Missing prompts/{floor_id}_boss.md"


@pytest.mark.parametrize("floor_id", FLOORS_WITH_PROMPTS)
def test_boss_prompt_references_floor(floor_id: str):
    content = _load_floor_prompt(floor_id)
    assert content is not None
    # Each prompt should mention the floor id or department name
    assert floor_id in content.lower() or "prometeo" in content.lower()


@pytest.mark.parametrize("floor_id", FLOORS_WITH_PROMPTS)
def test_build_floor_prompt_includes_boss_context(floor_id: str):
    prompt = build_floor_prompt(
        floor_id=floor_id,
        mission="Test mission",
        task="test task",
        workdocs_dir=f"vault/{floor_id}/",
    )
    # Boss prompt is prepended — check separator is present
    assert "---" in prompt
    # Generic template section must still be present
    assert "TAREA DE HOY" in prompt
    assert "test task" in prompt


def test_c_level_has_no_boss_prompt():
    # c_level intentionally has no boss prompt — it's not an autonomous agent floor
    content = _load_floor_prompt("c_level")
    assert content is None


def test_unknown_floor_returns_none():
    content = _load_floor_prompt("floor_inexistente")
    assert content is None


@pytest.mark.parametrize("floor_id", FLOORS_WITH_PROMPTS)
def test_boss_prompt_references_vault_templates(floor_id: str):
    content = _load_floor_prompt(floor_id)
    assert content is not None
    assert "vault/_templates" in content or "_templates" in content
