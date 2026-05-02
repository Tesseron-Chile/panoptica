# User Prompt

Implementar el piso `dev_software` de Panoptica como un piso Linear-driven.

El diseño completo está aprobado y documentado en `workdocs/2026-05-02-linear-driven-floor-design.md`.

## Resumen del diseño aprobado

**Boss = Dispatcher puro** (sesión corta ~1 min):
- Despierta por schedule diario (09:00) o comando manual
- Lee tickets en estado `Todo` del equipo Prometeo en Linear vía MCP
- Toma máximo 3 tickets, prioriza Urgent > High > Normal > Low
- Por cada ticket: escribe workdoc brief → lanza ralph session → mueve ticket a In Progress
- Termina. No espera, no implementa.

**Feature Agent = Ciclo completo autónomo** (sesión ralph independiente):
- Lee brief de `vault/dev_software/PRO-XX-brief.md`
- Plan → implementación → QA (Chrome si UI, tests si backend) → Done
- Escribe result workdoc al terminar

**Linear columns (Prometeo):** Triage → Backlog → Todo → In Progress → In Review → Done

**Repo:** Tesseron-Chile/panoptica  
**Target branch:** prometeo  
**Feature branch:** ralph/df5874d1

## Archivos a crear/modificar

### Modificar
- `backend/prompts/dev_software_boss.md` — reescribir como dispatcher puro con instrucciones Linear MCP
- `backend/floors.toml` — actualizar daily tasks de dev_software
- `backend/app/core/agent_runner.py` — agregar `run_ralph_session()`

### Crear
- `backend/prompts/dev_software_feature_agent.md` — prompt base para feature agents
- `backend/prompts/workdoc_templates/brief.md` — template brief
- `backend/prompts/workdoc_templates/result.md` — template result
