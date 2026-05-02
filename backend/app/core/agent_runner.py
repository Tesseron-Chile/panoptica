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

_PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"

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
5. Al terminar, reporta el resultado al updates board usando la herramienta Bash:
   curl -s -X POST http://localhost:8000/api/v1/floors/{floor_id}/updates \\
     -H "Content-Type: application/json" \\
     -d '{{"title":"<título>","priority":"<info|alert|critical>","body":"<detalle>"}}'
   Usa priority "critical" si encontraste [CRÍTICO], "alert" si hay advertencias, "info" para éxito.
"""


def _load_floor_prompt(floor_id: str) -> str | None:
    """Return content of prompts/<floor_id>_boss.md if it exists, else None."""
    path = _PROMPTS_DIR / f"{floor_id}_boss.md"
    if path.exists():
        return path.read_text(encoding="utf-8")
    return None


def build_floor_prompt(
    *,
    floor_id: str,
    mission: str,
    task: str,
    workdocs_dir: str,
) -> str:
    """Build the prompt string for a floor task agent session.

    If a floor-specific prompt file exists at prompts/<floor_id>_boss.md,
    it is prepended to provide richer context before the generic template.
    """
    date = datetime.now(UTC).strftime("%Y-%m-%d")
    slug = task[:30].lower().replace(" ", "-").replace("/", "-")
    base = _PROMPT_TEMPLATE.format(
        floor_id=floor_id,
        mission=mission,
        task=task,
        workdocs_dir=workdocs_dir,
        date=date,
        slug=slug,
    )
    extra = _load_floor_prompt(floor_id)
    if extra:
        return f"{extra}\n\n---\n\n{base}"
    return base


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
        try:
            await asyncio.create_subprocess_exec(
                "claude",
                "-p",
                prompt,
                env=env,
                cwd=cwd,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
        except FileNotFoundError:
            logger.exception(
                "AgentRunner: 'claude' not found on PATH — task=%r floor=%r",
                task,
                floor_id,
            )
