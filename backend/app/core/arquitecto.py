"""ArquitectoService — schedules and triggers the El Arquitecto meta-agent.

El Arquitecto runs weekly, reads vault workdocs across all floors, detects
patterns, and proposes improvements via the C-Level chat. It never executes
changes without explicit human approval.
"""

from __future__ import annotations

import logging
from pathlib import Path

from app.core.agent_runner import AgentRunner

logger = logging.getLogger(__name__)

_PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"
_C_LEVEL_FLOOR_ID = "c_level"


class ArquitectoService:
    """Manages the El Arquitecto meta-agent sessions."""

    def __init__(
        self,
        agent_runner: AgentRunner | None = None,
        vault_root: Path | None = None,
    ) -> None:
        self._runner = agent_runner or AgentRunner()
        self._vault_root = vault_root or (Path(__file__).parent.parent.parent.parent / "vault")

    async def run_observation_cycle(self) -> None:
        """Launch an Arquitecto session: observe all vaults → propose improvements."""
        vault_summary = self._summarize_vault()
        task = f"ciclo de observación del Arquitecto\n\n{vault_summary}"
        logger.info("ArquitectoService: starting observation cycle")
        await self._runner.run_floor_task(
            floor_id=_C_LEVEL_FLOOR_ID,
            task=task,
            mission="Observar todos los pisos, detectar patrones, proponer mejoras al sistema",
            workdocs_dir=f"vault/{_C_LEVEL_FLOOR_ID}/",
        )

    def _build_prompt(self) -> str:
        prompt_path = _PROMPTS_DIR / "arquitecto.md"
        base = prompt_path.read_text(encoding="utf-8") if prompt_path.exists() else ""

        vault_summary = self._summarize_vault()
        return f"{base}\n\n---\n\n## Estado actual del vault\n\n{vault_summary}"

    def _summarize_vault(self) -> str:
        """List recent workdocs across all floor vaults for the Arquitecto to read."""
        lines: list[str] = []
        if not self._vault_root.exists():
            return "El vault aún no tiene workdocs."

        for floor_dir in sorted(self._vault_root.iterdir()):
            if not floor_dir.is_dir() or floor_dir.name.startswith((".", "_")):
                continue
            docs = sorted(floor_dir.glob("*.md"), reverse=True)[:5]
            if docs:
                lines.append(f"### {floor_dir.name}")
                for doc in docs:
                    lines.append(f"- {doc.relative_to(self._vault_root)}")

        return "\n".join(lines) if lines else "No hay workdocs recientes en el vault."
