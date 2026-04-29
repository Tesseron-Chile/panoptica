# Company OS — Run A-1: Backend Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`⬜`) syntax for tracking.

**Goal:** Extend the backend with autonomous agent scheduling — floors.toml gets department fields (mission, schedule, workdocs_dir), hooks propagate floor_id, and two new services (agent_runner, scheduler) enable Claude Code CLI sessions to launch per-floor on a daily/weekly cron.

**Architecture:** FloorConfig gains optional fields without breaking existing floors. A lightweight AgentRunner wraps `asyncio.create_subprocess_exec` to launch `claude -p <prompt>` with `CLAUDE_OFFICE_FLOOR_ID` injected into the environment. An APScheduler service reads the floor schedule at startup and registers cron jobs that call AgentRunner.

**Tech Stack:** Python 3.13, FastAPI, APScheduler 3.x (`apscheduler`), asyncio subprocess, tomli (already installed), pytest-asyncio (already installed).

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `backend/pyproject.toml` | Add `apscheduler>=3.10` dependency |
| Modify | `backend/app/core/floor_config.py` | Add `FloorSchedule`, `mission`, `workdocs_dir`, `schedule`, `is_c_level`; parse explicit `id` field |
| Modify | `backend/floors.toml` | Replace Tesseron content with Prometeo departments |
| Modify | `hooks/src/claude_office_hooks/event_mapper.py` | Read `CLAUDE_OFFICE_FLOOR_ID` from env and attach to outgoing event |
| Create | `backend/app/core/agent_runner.py` | `run_floor_task(floor_id, task, workdir)` — launches `claude -p` subprocess |
| Create | `backend/app/core/scheduler.py` | `FloorScheduler` — APScheduler wrapper; reads floors, registers cron jobs |
| Modify | `backend/app/main.py` | Start/stop `FloorScheduler` in the FastAPI lifespan |
| Create | `backend/tests/test_floor_config_new_fields.py` | Unit tests for FloorConfig extension |
| Create | `backend/tests/test_agent_runner.py` | Unit tests for agent_runner (subprocess mocked) |
| Create | `backend/tests/test_scheduler.py` | Unit tests for FloorScheduler job registration |
| Create | `hooks/tests/test_floor_id_hook.py` | Unit test for floor_id propagation in event_mapper |

---

## Task 1: Add APScheduler dependency
**Status:** ⬜

**Files:**
- Modify: `backend/pyproject.toml`

⬜ **Step 1: Add apscheduler to dependencies**

In `backend/pyproject.toml`, add `"apscheduler>=3.10.4"` to the `dependencies` list:

```toml
dependencies = [
    "fastapi>=0.135.2",
    "uvicorn[standard]>=0.42.0",
    "websockets>=16.0",
    "sqlalchemy>=2.0.48",
    "alembic>=1.18.4",
    "pydantic>=2.12.5",
    "pydantic-settings>=2.13.1",
    "python-multipart>=0.0.22",
    "httpx>=0.28.1",
    "aiosqlite>=0.22.1",
    "asyncpg>=0.31.0",
    "rich>=14.3.3",
    "greenlet>=3.3.2",
    "anthropic>=0.86.0",
    "tomli>=2.4.1",
    "apscheduler>=3.10.4",
]
```

⬜ **Step 2: Sync the lockfile**

```bash
cd backend && uv sync
```

Expected: resolves and installs `apscheduler`.

⬜ **Step 3: Verify import**

```bash
cd backend && uv run python -c "from apscheduler.schedulers.asyncio import AsyncIOScheduler; print('ok')"
```

Expected output: `ok`

⬜ **Step 4: Commit**

```bash
git add backend/pyproject.toml backend/uv.lock
git commit -m "chore(deps): add apscheduler>=3.10.4 for floor task scheduling"
```

---

## Task 2: Extend FloorConfig with department fields
**Status:** ⬜

**Files:**
- Modify: `backend/app/core/floor_config.py`
- Create: `backend/tests/test_floor_config_new_fields.py`

⬜ **Step 1: Write the failing tests**

Create `backend/tests/test_floor_config_new_fields.py`:

```python
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
```

⬜ **Step 2: Run to confirm failure**

```bash
cd backend && uv run pytest tests/test_floor_config_new_fields.py -v
```

Expected: `ImportError` — `FloorSchedule` does not exist yet.

⬜ **Step 3: Implement the extended FloorConfig**

Replace the contents of `backend/app/core/floor_config.py`:

```python
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
    """Daily and weekly task schedule for a floor."""

    daily: list[str] = Field(default_factory=list)
    weekly: list[str] = Field(default_factory=list)


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
```

⬜ **Step 4: Run tests to confirm they pass**

```bash
cd backend && uv run pytest tests/test_floor_config_new_fields.py -v
```

Expected: all 10 tests pass.

⬜ **Step 5: Run full test suite to check for regressions**

```bash
cd backend && uv run pytest tests/ -q
```

Expected: all existing tests pass plus the 10 new ones.

⬜ **Step 6: Commit**

```bash
git add backend/app/core/floor_config.py backend/tests/test_floor_config_new_fields.py
git commit -m "feat(floors): extend FloorConfig with mission, workdocs_dir, schedule, is_c_level"
```

---

## Task 3: Update floors.toml with Prometeo departments
**Status:** ⬜

**Files:**
- Modify: `backend/floors.toml`

⬜ **Step 1: Replace floors.toml content**

Replace the entire content of `backend/floors.toml` with:

```toml
building_name = "Prometeo"

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
id = "dev_software"
name = "Desarrollo Software"
floor_number = 5
accent = "#3b82f6"
icon = "💻"
mission = "Construir y mantener el software de Prometeo"
workdocs_dir = "workdocs/dev_software/"
schedule.daily = [
    "revisar PRs abiertos y asignar reviewers",
    "correr suite de tests y reportar failures",
    "actualizar workdoc de estado del sprint",
]
schedule.weekly = [
    "reporte de deuda tecnica y prioridades",
    "review de arquitectura y dependencias",
]

[[floors]]
id = "dev_hardware"
name = "Desarrollo Hardware"
floor_number = 4
accent = "#f59e0b"
icon = "⚙️"
mission = "Disenar y mantener el hardware y firmware de Prometeo"
workdocs_dir = "workdocs/dev_hardware/"
schedule.daily = [
    "revisar issues de firmware abiertos",
    "actualizar workdoc de estado de dispositivos",
]
schedule.weekly = [
    "reporte de BOM y proveedores",
    "review de especificaciones de hardware",
]

[[floors]]
id = "customer_service"
name = "Customer Service"
floor_number = 3
accent = "#10b981"
icon = "🎧"
mission = "Resolver tickets y mantener alta satisfaccion de clientes de Prometeo"
workdocs_dir = "workdocs/customer_service/"
schedule.daily = [
    "revisar tickets abiertos y priorizar",
    "redactar respuestas a tickets pendientes",
    "actualizar workdoc de estado de soporte",
]
schedule.weekly = [
    "reporte de CSAT y tendencias",
    "escalaciones y casos criticos de la semana",
]

[[floors]]
id = "financiero"
name = "Financiero"
floor_number = 2
accent = "#a3e635"
icon = "💰"
mission = "Centralizar cobros, pagos y reportes financieros de Prometeo"
workdocs_dir = "workdocs/financiero/"
schedule.daily = [
    "revisar estado de facturas pendientes",
    "actualizar workdoc de flujo de caja",
]
schedule.weekly = [
    "reporte P&L de la semana",
    "conciliacion de pagos y cobros",
]

[[floors]]
id = "mkt_ventas"
name = "MKT y Ventas"
floor_number = 1
accent = "#f43f5e"
icon = "📣"
mission = "Generar demanda y cerrar ventas de Prometeo"
workdocs_dir = "workdocs/mkt_ventas/"
schedule.daily = [
    "revisar metricas de campanas activas",
    "actualizar pipeline de ventas en workdoc",
]
schedule.weekly = [
    "reporte de campanas y ROI",
    "propuesta de contenido para la proxima semana",
]
```

⬜ **Step 2: Verify the config loads correctly**

```bash
cd backend && uv run python -c "
from app.core.floor_config import load_building_config
from pathlib import Path
cfg = load_building_config(toml_path=Path('floors.toml'))
print('Building:', cfg.building_name)
for f in cfg.floors:
    print(f'  {f.floor_number}F [{f.id}] {f.icon} {f.name}')
    print(f'    daily: {len(f.schedule.daily)} tasks, weekly: {len(f.schedule.weekly)} tasks')
"
```

Expected output:
```
Building: Prometeo
  99F [c_level] 👔 C-Level
  5F [dev_software] 💻 Desarrollo Software
    daily: 3 tasks, weekly: 2 tasks
  4F [dev_hardware] ⚙️ Desarrollo Hardware
    daily: 2 tasks, weekly: 2 tasks
  3F [customer_service] 🎧 Customer Service
    daily: 3 tasks, weekly: 2 tasks
  2F [financiero] 💰 Financiero
    daily: 2 tasks, weekly: 2 tasks
  1F [mkt_ventas] 📣 MKT y Ventas
    daily: 2 tasks, weekly: 2 tasks
```

⬜ **Step 3: Run existing floor config tests**

```bash
cd backend && uv run pytest tests/test_floor_config.py tests/test_floor_config_new_fields.py -v
```

Expected: all pass.

⬜ **Step 4: Commit**

```bash
git add backend/floors.toml
git commit -m "feat(floors): configure Prometeo building with 6 departments"
```

---

## Task 4: Propagate CLAUDE_OFFICE_FLOOR_ID through hooks
**Status:** ⬜

**Files:**
- Modify: `hooks/src/claude_office_hooks/event_mapper.py`
- Create: `hooks/tests/test_floor_id_hook.py`

⬜ **Step 1: Write the failing test**

Create `hooks/tests/test_floor_id_hook.py`:

```python
"""Tests that CLAUDE_OFFICE_FLOOR_ID env var is picked up by the event mapper."""

import os
from unittest.mock import patch

from claude_office_hooks.event_mapper import map_event

# map_event signature: (event_type, raw_data, session_id, strip_prefixes=None) -> dict | None
MINIMAL_RAW = {
    "session_id": "test-session-123",
    "transcript_path": "/home/user/.claude/projects/my-project/session.jsonl",
}


def test_floor_id_included_when_env_set():
    with patch.dict(os.environ, {"CLAUDE_OFFICE_FLOOR_ID": "dev_software"}):
        event = map_event("session_start", MINIMAL_RAW, "test-session-123")
    assert event is not None
    assert event["data"]["floor_id"] == "dev_software"


def test_floor_id_absent_when_env_not_set():
    env = {k: v for k, v in os.environ.items() if k != "CLAUDE_OFFICE_FLOOR_ID"}
    with patch.dict(os.environ, env, clear=True):
        event = map_event("session_start", MINIMAL_RAW, "test-session-123")
    assert event is not None
    assert "floor_id" not in event["data"]
```

⬜ **Step 2: Run to confirm failure**

```bash
cd hooks && uv run pytest tests/test_floor_id_hook.py -v
```

Expected: `AssertionError` — `floor_id` key not present in `event["data"]`.

⬜ **Step 3: Update event_mapper.py to read CLAUDE_OFFICE_FLOOR_ID**

In `hooks/src/claude_office_hooks/event_mapper.py`, find `map_event`. After the block that reads `team_name` and `teammate_name` (around line 368-374), add:

```python
floor_id = os.environ.get("CLAUDE_OFFICE_FLOOR_ID")
if floor_id:
    data["floor_id"] = floor_id
```

The `os` import already exists at the top of the file — no new import needed.

⬜ **Step 4: Run the new test**

```bash
cd hooks && uv run pytest tests/test_floor_id_hook.py -v
```

Expected: both tests pass.

⬜ **Step 5: Run full hooks test suite**

```bash
cd hooks && uv run pytest tests/ -v
```

Expected: all pass.

⬜ **Step 6: Commit**

```bash
git add hooks/src/claude_office_hooks/event_mapper.py hooks/tests/test_floor_id_hook.py
git commit -m "feat(hooks): propagate CLAUDE_OFFICE_FLOOR_ID env var to backend events"
```

---

## Task 5: Implement agent_runner.py
**Status:** ⬜

**Files:**
- Create: `backend/app/core/agent_runner.py`
- Create: `backend/tests/test_agent_runner.py`

⬜ **Step 1: Write the failing tests**

Create `backend/tests/test_agent_runner.py`:

```python
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
```

⬜ **Step 2: Run to confirm failure**

```bash
cd backend && uv run pytest tests/test_agent_runner.py -v
```

Expected: `ModuleNotFoundError` — `agent_runner` does not exist yet.

⬜ **Step 3: Implement agent_runner.py**

Create `backend/app/core/agent_runner.py`:

```python
"""AgentRunner — launches Claude Code CLI sessions for autonomous floor tasks.

Each call to ``run_floor_task`` spawns a non-blocking ``claude -p`` subprocess
with the floor's context injected via environment variables. The hooks already
installed in Claude Code pick up CLAUDE_OFFICE_FLOOR_ID and route events to
the correct floor in the visualizer.
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import UTC, datetime
from pathlib import Path

logger = logging.getLogger(__name__)

_PROMPT_TEMPLATE = """\
Eres el agente autónomo del departamento "{floor_id}" de Prometeo.

MISIÓN DEL DEPARTAMENTO:
{mission}

TAREA DE HOY:
{task}

INSTRUCCIONES:
1. Ejecuta la tarea indicada con criterio profesional.
2. Al terminar, escribe un workdoc de resultado en: {workdocs_dir}
   - Nombre del archivo: {date}-{slug}.md
   - Incluye: resumen ejecutivo, acciones tomadas, resultado, y próximos pasos.
3. Si encuentras algo crítico (error grave, presupuesto en riesgo, bloqueante),
   indícalo claramente con el prefijo [CRÍTICO] en el resumen.
4. Sé conciso. El boss del departamento revisará el workdoc al finalizar.
"""


def build_floor_prompt(
    *,
    floor_id: str,
    mission: str,
    task: str,
    workdocs_dir: str,
) -> str:
    """Build the prompt string for a floor task agent session."""
    date = datetime.now(UTC).strftime("%Y-%m-%d")
    slug = task[:30].lower().replace(" ", "-").replace("/", "-")
    return _PROMPT_TEMPLATE.format(
        floor_id=floor_id,
        mission=mission,
        task=task,
        workdocs_dir=workdocs_dir,
        date=date,
        slug=slug,
    )


class AgentRunner:
    """Launches autonomous Claude Code CLI sessions for floor tasks."""

    async def run_floor_task(
        self,
        *,
        floor_id: str,
        task: str,
        mission: str,
        workdocs_dir: str,
        workdir: Path | None = None,
    ) -> None:
        """Fire-and-forget: launch a Claude Code session for a single floor task.

        The subprocess is not awaited — it runs independently. The existing
        Claude Code hooks route its events back to the backend under the
        correct floor_id.
        """
        prompt = build_floor_prompt(
            floor_id=floor_id,
            mission=mission,
            task=task,
            workdocs_dir=workdocs_dir,
        )
        env = {
            **os.environ,
            "CLAUDE_OFFICE_FLOOR_ID": floor_id,
            "CLAUDE_OFFICE_TASK": task,
        }
        cwd = str(workdir) if workdir else None

        logger.info("AgentRunner: launching task=%r for floor=%r", task, floor_id)
        # Note: claude -p runs in non-interactive print mode.
        # Verify flags against installed Claude Code version during Run A-1.
        await asyncio.create_subprocess_exec(
            "claude",
            "-p",
            prompt,
            env=env,
            cwd=cwd,
        )
```

⬜ **Step 4: Run tests**

```bash
cd backend && uv run pytest tests/test_agent_runner.py -v
```

Expected: all 4 tests pass.

⬜ **Step 5: Commit**

```bash
git add backend/app/core/agent_runner.py backend/tests/test_agent_runner.py
git commit -m "feat(core): add AgentRunner — launches Claude Code CLI sessions for floor tasks"
```

---

## Task 6: Implement scheduler.py
**Status:** ⬜

**Files:**
- Create: `backend/app/core/scheduler.py`
- Create: `backend/tests/test_scheduler.py`

⬜ **Step 1: Write the failing tests**

Create `backend/tests/test_scheduler.py`:

```python
"""Tests for FloorScheduler job registration."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.floor_config import FloorConfig, FloorSchedule
from app.core.scheduler import FloorScheduler


def _make_floor(floor_id: str, daily: list[str], weekly: list[str]) -> FloorConfig:
    return FloorConfig(
        id=floor_id,
        name=floor_id.replace("_", " ").title(),
        floor_number=1,
        accent="#ffffff",
        icon="🏢",
        schedule=FloorSchedule(daily=daily, weekly=weekly),
        mission="Test mission",
        workdocs_dir=f"workdocs/{floor_id}/",
    )


def test_scheduler_registers_daily_jobs():
    floors = [
        _make_floor("dev_software", daily=["task1", "task2"], weekly=[]),
        _make_floor("mkt_ventas", daily=["task3"], weekly=[]),
    ]
    scheduler = FloorScheduler(floors=floors)
    # 2 daily tasks for dev_software + 1 for mkt_ventas = 3 jobs
    assert scheduler.job_count() == 3


def test_scheduler_registers_weekly_jobs():
    floors = [
        _make_floor("dev_software", daily=[], weekly=["weekly1", "weekly2"]),
    ]
    scheduler = FloorScheduler(floors=floors)
    assert scheduler.job_count() == 2


def test_scheduler_skips_floors_with_no_schedule():
    floors = [
        _make_floor("c_level", daily=[], weekly=[]),
        _make_floor("dev_software", daily=["task1"], weekly=[]),
    ]
    scheduler = FloorScheduler(floors=floors)
    assert scheduler.job_count() == 1


def test_scheduler_start_and_stop():
    floors = [_make_floor("dev_software", daily=["t1"], weekly=[])]
    scheduler = FloorScheduler(floors=floors)

    with patch.object(scheduler._scheduler, "start") as mock_start, \
         patch.object(scheduler._scheduler, "shutdown") as mock_shutdown:
        scheduler.start()
        mock_start.assert_called_once()
        scheduler.stop()
        mock_shutdown.assert_called_once_with(wait=False)


@pytest.mark.asyncio
async def test_scheduler_calls_agent_runner_on_trigger():
    floors = [_make_floor("dev_software", daily=["revisar PRs"], weekly=[])]
    mock_runner = AsyncMock()
    scheduler = FloorScheduler(floors=floors, agent_runner=mock_runner)

    await scheduler._trigger_task(
        floor_id="dev_software",
        task="revisar PRs",
        mission="Test mission",
        workdocs_dir="workdocs/dev_software/",
    )

    mock_runner.run_floor_task.assert_called_once_with(
        floor_id="dev_software",
        task="revisar PRs",
        mission="Test mission",
        workdocs_dir="workdocs/dev_software/",
    )
```

⬜ **Step 2: Run to confirm failure**

```bash
cd backend && uv run pytest tests/test_scheduler.py -v
```

Expected: `ModuleNotFoundError` — scheduler does not exist yet.

⬜ **Step 3: Implement scheduler.py**

Create `backend/app/core/scheduler.py`:

```python
"""FloorScheduler — registers daily/weekly cron jobs per floor.

Uses APScheduler 3.x with AsyncIOScheduler so jobs run on the existing
FastAPI event loop without spawning extra threads.

Jobs call AgentRunner.run_floor_task, which fires a Claude Code CLI
subprocess that the existing hooks route back to the correct floor.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.agent_runner import AgentRunner
from app.core.floor_config import FloorConfig

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

# Daily jobs fire at 09:00 local time; weekly jobs fire Mondays at 09:00.
_DAILY_CRON = {"hour": 9, "minute": 0}
_WEEKLY_CRON = {"day_of_week": "mon", "hour": 9, "minute": 0}


class FloorScheduler:
    """Manages scheduled autonomous agent tasks for all floors."""

    def __init__(
        self,
        floors: list[FloorConfig],
        agent_runner: AgentRunner | None = None,
    ) -> None:
        self._runner = agent_runner or AgentRunner()
        self._scheduler = AsyncIOScheduler()
        self._job_count = 0
        self._register_jobs(floors)

    def _register_jobs(self, floors: list[FloorConfig]) -> None:
        for floor in floors:
            if floor.is_c_level:
                continue
            for task in floor.schedule.daily:
                self._scheduler.add_job(
                    self._trigger_task,
                    CronTrigger(**_DAILY_CRON),
                    args=[floor.id, task, floor.mission, floor.workdocs_dir],
                    id=f"{floor.id}__daily__{self._job_count}",
                )
                self._job_count += 1
            for task in floor.schedule.weekly:
                self._scheduler.add_job(
                    self._trigger_task,
                    CronTrigger(**_WEEKLY_CRON),
                    args=[floor.id, task, floor.mission, floor.workdocs_dir],
                    id=f"{floor.id}__weekly__{self._job_count}",
                )
                self._job_count += 1

    def job_count(self) -> int:
        """Return the number of registered cron jobs."""
        return self._job_count

    def start(self) -> None:
        """Start the scheduler. Call once during FastAPI lifespan startup."""
        self._scheduler.start()
        logger.info("FloorScheduler started with %d jobs", self._job_count)

    def stop(self) -> None:
        """Stop the scheduler gracefully. Call during FastAPI lifespan shutdown."""
        self._scheduler.shutdown(wait=False)
        logger.info("FloorScheduler stopped")

    async def _trigger_task(
        self,
        floor_id: str,
        task: str,
        mission: str,
        workdocs_dir: str,
    ) -> None:
        """Called by APScheduler to run a single floor task."""
        logger.info("FloorScheduler: triggering task=%r floor=%r", task, floor_id)
        await self._runner.run_floor_task(
            floor_id=floor_id,
            task=task,
            mission=mission,
            workdocs_dir=workdocs_dir,
        )
```

⬜ **Step 4: Run tests**

```bash
cd backend && uv run pytest tests/test_scheduler.py -v
```

Expected: all 5 tests pass.

⬜ **Step 5: Run full suite**

```bash
cd backend && uv run pytest tests/ -q
```

Expected: all pass.

⬜ **Step 6: Commit**

```bash
git add backend/app/core/scheduler.py backend/tests/test_scheduler.py
git commit -m "feat(core): add FloorScheduler — daily/weekly cron jobs per department"
```

---

## Task 7: Wire FloorScheduler into FastAPI lifespan
**Status:** ⬜

**Files:**
- Modify: `backend/app/main.py`

⬜ **Step 1: Add scheduler startup/shutdown to lifespan**

In `backend/app/main.py`, add the import at the top (after existing imports):

```python
from app.core.floor_config import get_building_config
from app.core.scheduler import FloorScheduler
```

Then update the `lifespan` function — add scheduler start after `await event_processor.start_watchers()` and stop before `await event_processor.stop_watchers()`:

```python
@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and shutdown lifecycle."""
    importlib.import_module("app.db.models")
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _migrate_schema(conn)

    git_service.start()
    await event_processor.start_watchers()

    # Start the floor scheduler
    building = get_building_config()
    floor_scheduler = FloorScheduler(floors=building.floors)
    floor_scheduler.start()

    yield

    floor_scheduler.stop()
    await event_processor.stop_watchers()
    await git_service.stop()
    await get_engine().dispose()
```

⬜ **Step 2: Verify the server starts without errors**

```bash
cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
sleep 3
curl -s http://localhost:8000/health
kill %1
```

Expected: `{"status":"ok"}` with no errors in logs.

⬜ **Step 3: Verify scheduler log line appears**

```bash
cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 2>&1 | head -20 &
sleep 3
kill %1
```

Expected: log line like `FloorScheduler started with N jobs` visible.

⬜ **Step 4: Run full test suite**

```bash
cd backend && uv run pytest tests/ -q
```

Expected: all pass (lifespan is not directly tested here — server startup verifies it).

⬜ **Step 5: Run checkall**

```bash
cd backend && make checkall
```

Expected: format, lint, typecheck, tests all pass.

⬜ **Step 6: Commit**

```bash
git add backend/app/main.py
git commit -m "feat(main): start FloorScheduler in FastAPI lifespan"
```

---

## Wrap-up

⬜ **Run the full backend suite one final time**

```bash
cd backend && uv run pytest tests/ -q && echo "ALL PASS"
```

⬜ **Run hooks tests**

```bash
cd hooks && uv run pytest tests/ -q && echo "ALL PASS"
```

⬜ **Run full checkall from root**

```bash
make checkall
```

⬜ **Verify floors API returns Prometeo config**

```bash
cd backend && uv run uvicorn app.main:app --port 8000 &
sleep 2
curl -s http://localhost:8000/api/v1/floors | python3 -m json.tool | grep '"name"'
kill %1
```

Expected: `"Prometeo"`, `"Desarrollo Software"`, `"Customer Service"`, etc.

⬜ **Final commit tag**

```bash
git commit --allow-empty -m "chore: Run A-1 complete — Company OS backend infrastructure"
```
