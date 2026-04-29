"""Tests for WorkdocWatcher — detects new workdoc files and triggers boss review."""

from pathlib import Path
from unittest.mock import AsyncMock

import pytest

from app.core.floor_config import FloorConfig, FloorSchedule
from app.core.workdoc_watcher import WorkdocWatcher


def _make_floor(floor_id: str) -> FloorConfig:
    return FloorConfig(
        id=floor_id,
        name=floor_id.replace("_", " ").title(),
        floor_number=1,
        accent="#3b82f6",
        icon="💻",
        schedule=FloorSchedule(daily=["tarea diaria"], weekly=[]),
        mission="Test mission",
        workdocs_dir=f"workdocs/{floor_id}/",
    )


@pytest.mark.asyncio
async def test_new_file_triggers_runner(tmp_path: Path):
    floor = _make_floor("dev_software")
    mock_runner = AsyncMock()

    # Override workdocs_dir to point to tmp dir
    floor.workdocs_dir = str(tmp_path) + "/"

    watcher = WorkdocWatcher(floors=[floor], agent_runner=mock_runner, repo_root=Path("/"))
    # Seed seen set as empty — as if watcher just started
    watcher._seen["dev_software"] = set()

    # Write a new workdoc
    workdoc = tmp_path / "2026-04-29-test-task.md"
    workdoc.write_text("# Test workdoc\n\n## Resumen\nTest result.")

    await watcher._check_floor(floor)

    mock_runner.run_floor_task.assert_called_once()
    call_kwargs = mock_runner.run_floor_task.call_args.kwargs
    assert call_kwargs["floor_id"] == "dev_software"
    assert str(workdoc) in call_kwargs["task"]


@pytest.mark.asyncio
async def test_seen_files_not_retriggered(tmp_path: Path):
    floor = _make_floor("dev_software")
    floor.workdocs_dir = str(tmp_path) + "/"
    mock_runner = AsyncMock()

    watcher = WorkdocWatcher(floors=[floor], agent_runner=mock_runner, repo_root=Path("/"))

    workdoc = tmp_path / "2026-04-29-existing.md"
    workdoc.write_text("# Already seen")

    # First check — marks file as seen
    await watcher._check_floor(floor)
    assert mock_runner.run_floor_task.call_count == 1

    # Second check — same file should not trigger again
    await watcher._check_floor(floor)
    assert mock_runner.run_floor_task.call_count == 1


@pytest.mark.asyncio
async def test_missing_workdocs_dir_does_not_crash(tmp_path: Path):
    floor = _make_floor("dev_software")
    floor.workdocs_dir = str(tmp_path / "nonexistent") + "/"
    mock_runner = AsyncMock()

    watcher = WorkdocWatcher(floors=[floor], agent_runner=mock_runner, repo_root=Path("/"))
    # Should not raise even though directory doesn't exist
    await watcher._check_floor(floor)
    mock_runner.run_floor_task.assert_not_called()


@pytest.mark.asyncio
async def test_c_level_floor_excluded():
    c_level = FloorConfig(
        id="c_level",
        name="C Level",
        floor_number=99,
        accent="#8b5cf6",
        icon="👔",
        schedule=FloorSchedule(daily=[], weekly=[]),
        mission="Strategic oversight",
        workdocs_dir="workdocs/c_level/",
        is_c_level=True,
    )
    mock_runner = AsyncMock()
    watcher = WorkdocWatcher(floors=[c_level], agent_runner=mock_runner)
    # C-Level floor should be excluded from watcher
    assert len(watcher._floors) == 0
