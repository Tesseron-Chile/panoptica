"""Tests for the AgentRunner service."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.agent_runner import AgentRunner, build_floor_prompt


def test_build_floor_prompt_includes_mission():
    prompt = build_floor_prompt(
        floor_id="dev_software",
        mission="Construir y mantener el software de Prometeo",
        task="revisar PRs abiertos",
        workdocs_dir="workdocs/dev_software/",
    )
    assert "dev_software" in prompt
    assert "Construir y mantener el software de Prometeo" in prompt
    assert "revisar PRs abiertos" in prompt
    assert "workdocs/dev_software/" in prompt


def test_build_floor_prompt_includes_workdoc_instructions():
    prompt = build_floor_prompt(
        floor_id="cs",
        mission="Soporte",
        task="revisar tickets",
        workdocs_dir="workdocs/cs/",
    )
    # Prompt should instruct the agent to write a workdoc
    assert "workdoc" in prompt.lower()


@pytest.mark.asyncio
async def test_run_floor_task_launches_subprocess():
    runner = AgentRunner()
    mock_proc = MagicMock()
    mock_proc.pid = 42

    with patch("app.core.agent_runner.asyncio.create_subprocess_exec", new_callable=AsyncMock) as mock_exec:
        mock_exec.return_value = mock_proc
        await runner.run_floor_task(
            floor_id="dev_software",
            task="revisar PRs abiertos",
            mission="Construir y mantener el software de Prometeo",
            workdocs_dir="workdocs/dev_software/",
        )

    mock_exec.assert_called_once()
    call_args = mock_exec.call_args
    # First positional arg is the command ("claude")
    assert call_args.args[0] == "claude"
    # env should contain CLAUDE_OFFICE_FLOOR_ID
    env = call_args.kwargs.get("env", {})
    assert env.get("CLAUDE_OFFICE_FLOOR_ID") == "dev_software"


@pytest.mark.asyncio
async def test_run_floor_task_env_contains_task():
    runner = AgentRunner()
    mock_proc = MagicMock()

    with patch("app.core.agent_runner.asyncio.create_subprocess_exec", new_callable=AsyncMock) as mock_exec:
        mock_exec.return_value = mock_proc
        await runner.run_floor_task(
            floor_id="mkt_ventas",
            task="revisar metricas",
            mission="Generar demanda",
            workdocs_dir="workdocs/mkt_ventas/",
        )

    env = mock_exec.call_args.kwargs.get("env", {})
    assert env.get("CLAUDE_OFFICE_TASK") == "revisar metricas"
    assert env.get("CLAUDE_OFFICE_FLOOR_ID") == "mkt_ventas"
