# Linear-Driven dev_software Floor — Design Spec

**Date:** 2026-05-02
**Status:** Approved
**Floor:** dev_software (piso 5)

---

## Objetivo

Rediseñar el piso `dev_software` para que opere con Linear como única fuente de verdad para las tareas. Las tareas se crean en Linear (por humano, boss, o C-Level), el boss las baja y despacha agentes autónomos que ejecutan el ciclo completo plan → implementación → QA → Done.

---

## Linear — Estructura de Estados (Prometeo)

| Estado | Tipo | Quién lo mueve |
|--------|------|----------------|
| Triage | triage | Humano / C-Level |
| Backlog | backlog | Humano / boss |
| **Todo** | unstarted | Humano / boss ← **boss toma de aquí** |
| **In Progress** | started | Boss (al despachar agente) |
| **In Review** | started | Feature agent (al terminar implementación) |
| **Done** | completed | Feature agent (tras QA exitoso) |
| Canceled | canceled | Humano |
| Duplicate | canceled | Humano |

---

## Arquitectura

### Boss — Dispatcher puro

El boss es una sesión Claude corta (~1 min). No implementa nada.

**Activación:**
- Schedule diario (09:00 AM via `FloorScheduler`)
- Comando manual explícito: "trabaja en PRO-XX" o "toma el sprint"

**Ciclo por activación:**
1. Consulta Linear vía MCP → lee todos los tickets en estado `Todo` del equipo Prometeo
2. Prioriza: Urgent > High > Normal > Low; dentro del mismo ciclo activo primero
3. Toma máximo **3 tickets por activación** (evitar saturar recursos del sistema)
4. Por cada ticket:
   a. Genera `vault/dev_software/PRO-XX-brief.md` con el contexto completo
   b. Lanza una nueva sesión Claude CLI con ralph loop, pasando el brief como contexto
   c. Mueve el ticket de `Todo` → `In Progress` en Linear
5. Termina. No espera, no monitorea.

**Restricciones:**
- No retoma tickets ya en `In Progress` o `In Review`
- No implementa código
- No toma tickets sin descripción o criterios de aceptación

---

### Feature Agent — Ciclo completo autónomo

Cada feature agent es una sesión ralph independiente. El boss lanza N en paralelo.

**Ciclo:**

1. **Lee brief** — `vault/dev_software/PRO-XX-brief.md`: título, descripción, criterios de aceptación, branch, flag `chrome_qa`
2. **Plan** — usa `writing-plans` skill: analiza el repo, escribe plan de implementación. Si el ticket tiene sub-issues independientes, evalúa spawnear sub-agentes en paralelo
3. **Implementación** — codea, escribe tests, hace commit, crea PR apuntando al branch del ticket, espera que CI pase
4. **QA:**
   - Si `chrome_qa: true` (ticket toca UI): mueve ticket a `In Review`, abre Chrome, navega el flujo afectado, valida visualmente
     - Pasa → mueve a `Done`
     - Falla → mueve de vuelta a `In Progress`, comenta en Linear con hallazgos detallados
   - Si `chrome_qa: false` (backend puro, infra, migrations): con tests verdes + CI verde mueve directo a `Done`
5. **Result workdoc** — escribe `vault/dev_software/PRO-XX-result.md` con: estado final, PR URL, resultado QA, issues encontrados, duración aproximada
6. Termina.

**Determinación de `chrome_qa`:**
El boss evalúa la descripción del ticket al escribir el brief:
- Toca UI/UX, componentes React, rutas del frontend → `chrome_qa: true`
- Solo backend, API, migrations, CI/CD, infra → `chrome_qa: false`
- En caso de duda → `chrome_qa: true`

**Si el agente falla a mitad del ciclo:**
- Ticket queda en `In Progress` (no se movió a Done)
- Workdoc result no existe o está incompleto
- El boss en la siguiente activación NO retoma el ticket
- El `workdoc_watcher` detecta ausencia de result después de 4 horas → genera floor update de alerta
- Requiere intervención manual

---

## Workdoc Templates

### Brief (`vault/dev_software/PRO-XX-brief.md`)

```markdown
# PRO-XX Brief

ticket_id: PRO-XX
title: <título del ticket>
priority: Urgent | High | Normal | Low
linear_url: https://linear.app/tesseron/issue/PRO-XX/...
branch: <gitBranchName del ticket>
chrome_qa: true | false
created_by_boss: <timestamp>

## Descripción
<descripción completa del ticket>

## Criterios de aceptación
- <criterio 1>
- <criterio 2>

## Contexto adicional
<sub-issues si existen, links relacionados, notas del boss>
```

### Result (`vault/dev_software/PRO-XX-result.md`)

```markdown
# PRO-XX Result

ticket_id: PRO-XX
final_status: Done | Failed | Blocked
pr_url: https://github.com/Tesseron-Chile/prometeo-arius/pull/XX
qa_result: passed | failed | skipped
completed_at: <timestamp>

## Qué se hizo
<resumen de la implementación>

## QA
<resultado de Chrome QA si aplica, o confirmación de tests>

## Issues encontrados
<bugs, blockers, o deuda técnica descubierta durante la implementación>
```

---

## Cambios al Codebase

### Modificar

| Archivo | Cambio |
|---------|--------|
| `backend/prompts/dev_software_boss.md` | Reemplazar con rol de dispatcher: instrucciones Linear MCP, template de brief, límite de 3 tickets, criterio de prioridad, reglas de `chrome_qa` |
| `backend/floors.toml` | Actualizar `daily` tasks del piso `dev_software`: "revisar Linear Todo y despachar feature agents via ralph" |
| `backend/app/core/agent_runner.py` | Agregar `run_ralph_session(floor_id, ticket_id, brief_path)` que spawnea `claude` CLI con ralph skill + brief como contexto inicial |

### Crear

| Archivo | Propósito |
|---------|-----------|
| `backend/prompts/dev_software_feature_agent.md` | Prompt base para feature agents: cómo leer el brief, cuándo usar Chrome QA, cómo mover tickets en Linear, cómo escribir result workdoc |
| `backend/prompts/workdoc_templates/brief.md` | Template vacío del brief para que el boss lo complete |
| `backend/prompts/workdoc_templates/result.md` | Template vacío del result para que el agente lo complete |

### Sin cambios

- `backend/app/core/scheduler.py` — el schedule diario ya existe, solo cambia el prompt del boss
- `backend/app/core/workdoc_watcher.py` — ya detecta nuevos `.md` en `vault/dev_software/`, muestra result workdocs como floor updates automáticamente
- `backend/app/core/event_processor.py` — sin cambios
- `backend/app/api/routes/floor_updates.py` — sin cambios
- `backend/app/core/room_orchestrator.py` — sin cambios

---

## Flujo end-to-end (ejemplo PRO-64)

```
09:00 AM — FloorScheduler activa boss dev_software
Boss lee Linear → encuentra PRO-64 (Backlog → 500 error) en Todo, priority Medium
Boss escribe vault/dev_software/PRO-64-brief.md (chrome_qa: false — backend puro)
Boss lanza: claude --session PRO-64 -p "ralph loop. Brief: vault/dev_software/PRO-64-brief.md"
Boss mueve PRO-64 → In Progress en Linear
Boss termina.

[sesión PRO-64 corre independiente]
Feature agent lee brief → plan (analiza tenant isolation en Prisma)
Feature agent implementa fix → tests verdes → CI verde → PR #XX creado
chrome_qa: false → mueve PRO-64 → Done en Linear
Escribe vault/dev_software/PRO-64-result.md
workdoc_watcher detecta result → floor update "PRO-64 completado" en el visualizador
Sesión termina.
```

---

## Criterios de éxito

- El boss completa su ciclo en < 2 minutos
- Cada feature agent opera completamente independiente (sin coordinación con el boss)
- Los tickets se mueven en Linear de forma consistente con el estado real del trabajo
- Los result workdocs aparecen como floor updates en el visualizador
- Un ticket en `In Progress` por más de 4 horas sin result genera alerta
