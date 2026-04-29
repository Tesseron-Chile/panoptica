# Prometeo Company OS — Design Spec

**Date:** 2026-04-28
**Status:** Approved
**Approach:** Platform First (Enfoque 3) — infraestructura genérica + primer piso real

## Vision

Transformar panoptica de visualizador pasivo de Claude Code en un **sistema operativo de empresa IA** autónomo. Cada piso del edificio representa un departamento de Prometeo. Los agentes trabajan solos según un calendario, se comunican vía workdocs, y el humano interactúa desde un chat por piso y un C-Level ejecutivo. El sistema puede mejorarse a sí mismo a través del Arquitecto.

---

## Architecture

### From → To

**Hoy:** Claude Code (tú) → Hooks → FastAPI Backend → WebSocket → PixiJS (visualizador pasivo)

**Nuevo:** Scheduler → Agent Runner → Claude Code CLI → Hooks (+ floor_id) → FastAPI (extendido) → WebSocket → PixiJS + Chat + C-Level

### Layer Stack

```
Capa 4 — C-Level (El Arquitecto)
  Dashboard ejecutivo · Visión · Centros de costo · Arquitecto (self-improvement)

Capa 3 — Pisos de departamento
  Dev Software · Dev Hardware · Customer Service · Financiero · MKT y Ventas

Capa 2 — Orquestación (NUEVO)
  Scheduler · Agent Runner · Chat API · Workdoc Tracker · Alerts Engine

Capa 1 — Infraestructura existente (sin cambios)
  Hooks · FastAPI · SQLite · WebSocket · PixiJS · floors.toml
```

### Key Mechanism: CLAUDE_OFFICE_FLOOR_ID

El Agent Runner lanza cada sesión de Claude Code con `CLAUDE_OFFICE_FLOOR_ID=<floor_id>` en el entorno. Los hooks existentes pasan esa variable al backend, que asigna el evento al piso correcto. El canvas PixiJS no requiere cambios.

---

## Section 1 — Floor/Department System

### Pisos iniciales (Prometeo Building)

| Piso | ID | Nombre | Accent |
|------|----|--------|--------|
| C | `c_level` | C-Level | `#8b5cf6` |
| 5F | `dev_software` | Desarrollo Software | `#3b82f6` |
| 4F | `dev_hardware` | Desarrollo Hardware | `#f59e0b` |
| 3F | `customer_service` | Customer Service | `#10b981` |
| 2F | `financiero` | Financiero | `#a3e635` |
| 1F | `mkt_ventas` | MKT y Ventas | `#f43f5e` |

### floors.toml — campos nuevos por piso

Los campos existentes (`floor_number`, `name`, `accent`, `icon`, `repos`) no cambian. Se agregan:

```toml
[[floors]]
id            = "dev_software"
name          = "Desarrollo Software"
floor_number  = 5
accent        = "#3b82f6"
icon          = "💻"
repos         = ["prometeo-core"]

# Campos nuevos
mission       = "Construir y mantener el software de Prometeo"
workdocs_dir  = "workdocs/dev_software/"
schedule.daily  = ["revisar PRs abiertos", "correr suite de tests", "actualizar workdoc de estado"]
schedule.weekly = ["reporte de deuda técnica", "review de arquitectura"]
```

### Navigation (sin cambios)

La navegación existente `BuildingView → FloorView` con zoom se mantiene intacta.

**BuildingView** agrega:
- Fila especial de C-Level en la parte superior (borde morado, estilo diferenciado)
- Updates bar en el fondo mostrando los últimos updates críticos cross-pisos

**FloorView** agrega:
- Nuevo tab **Chat** en el `RightSidebar` existente (al lado de Events y Git)
- Label del piso en el canvas ya existente muestra la misión en tooltip

---

## Section 2 — Scheduling & Agent Autonomy

### Scheduler Service

Nuevo servicio en el backend (`backend/app/core/scheduler.py`) usando **APScheduler** (compatible con FastAPI). Al arrancar lee `floors.toml` y registra una tarea por cada entrada en `schedule.daily` (cron `0 9 * * *` por defecto) y `schedule.weekly` (cron `0 9 * * 1`).

```python
# Pseudocódigo
for floor in floors:
    for task in floor.schedule.daily:
        scheduler.add_job(run_floor_task, CronTrigger(hour=9),
                          args=[floor.id, task])
```

Triggers manuales disponibles vía:
- Chat de piso: mensaje al boss del piso
- C-Level chat: directiva a cualquier piso
- API endpoint: `POST /api/v1/floors/{floor_id}/tasks/trigger`

### Agent Runner

Nuevo servicio (`backend/app/core/agent_runner.py`) que lanza sesiones de Claude Code CLI:

```python
env = {
    **os.environ,
    "CLAUDE_OFFICE_FLOOR_ID": floor_id,
    "CLAUDE_OFFICE_TASK": task_description,
}
# Nota: los flags exactos de invocación (`-p`, `--print`, stdin vs. argumento)
# se verifican en Run A-1 contra la versión instalada de Claude Code CLI.
subprocess.Popen(["claude", "-p", prompt], env=env, cwd=workdir)
```

El prompt incluye: misión del piso, tarea a ejecutar, ruta de workdocs, instrucciones de formato de output. El `workdir` es la raíz del repositorio de ese piso.

### Workdoc Pipeline

1. Scheduler dispara tarea → Agent Runner lanza Claude Code con `floor_id`
2. Worker ejecuta tarea → escribe `workdocs/<floor_id>/YYYY-MM-DD-<task>.md`
3. Backend detecta nuevo workdoc (via `task_file_poller.py` extendido) → llama a Agent Runner con tarea `"review workdoc: <ruta>"`
4. Agent Runner lanza nueva sesión Claude Code para el boss → lee workdoc → aprueba o solicita cambios
5. Boss postea update al Updates Board con resultado y nivel de prioridad
6. Si falla → alerta crítica al updates bar + badge rojo en BuildingView

**Principio:** Los jefes nunca se comunican directamente entre sí. Solo leen y escriben workdocs en disco. La comunicación es asincrónica por archivos.

---

## Section 3 — Chat System

### Estructura

Un canal de chat dedicado por piso (Opción A). El chat vive en el `RightSidebar` como nuevo tab.

### Backend

Nuevo endpoint y tabla en SQLite:

```
chat_messages (id, floor_id, sender, role, content, timestamp)
```

- `POST /api/v1/floors/{floor_id}/chat` — enviar mensaje
- `GET /api/v1/floors/{floor_id}/chat` — historial
- WebSocket broadcast cuando llega mensaje nuevo al piso activo

### Frontend

El tab **Chat** en `RightSidebar` muestra:
- Historial de mensajes con burbujas diferenciadas (tú vs. agente)
- Input para escribir al boss del piso
- Al enviar: el mensaje se convierte en tarea de alta prioridad para el boss del piso

El boss responde via el mismo pipeline de Claude Code + hooks, con su respuesta escribiéndose al chat.

---

## Section 4 — Updates Board

### Nuevo modo de whiteboard: `updates`

Se agrega como modo 12 al whiteboard existente (actualmente tiene 11 modos). Keyboard shortcut: `U`.

### Estructura de un update

```python
class FloorUpdate(BaseModel):
    floor_id: str
    priority: Literal["critical", "alert", "info", "report"]
    title: str
    body: str
    timestamp: datetime
    auto_expire_hours: int = 24  # críticos no expiran hasta resolverse
```

### Prioridades

| Nivel | Color | Comportamiento |
|-------|-------|----------------|
| `critical` | Rojo `#ef4444` | Badge en BuildingView · No expira · Notifica C-Level |
| `alert` | Naranja `#f59e0b` | Visible 48h |
| `info` | Verde `#22c55e` | Visible 24h |
| `report` | Azul `#3b82f6` | Visible 24h |

### Updates Bar

Barra fija en la parte inferior del BuildingView mostrando los 3 updates más recientes/urgentes cross-pisos.

---

## Section 5 — C-Level Floor

### CLevelView

Vista especial que reemplaza `FloorView` cuando el usuario navega al piso C-Level. Tres columnas:

**Columna izquierda — Estado de pisos:**
- Un card por departamento con LED de estado (verde/naranja/rojo)
- Último update del piso
- Chat global de C-Level al fondo

**Columna central — El Arquitecto:**
- Workspace dedicado con estética de penthouse
- Muestra actividad actual del Arquitecto
- Sus propuestas de mejora pendientes de aprobación

**Columna derecha — Visión y gestión:**
- Texto de visión de la empresa (editable)
- Centros de costo por piso (en USD/mes, alimentado por Financiero)
- Directivas activas (tareas de alta prioridad enviadas a pisos)

### Directivas

Desde el chat de C-Level, mensajes con formato `@dev_software: <instrucción>` se convierten en tareas de prioridad máxima para ese piso, superponiéndose al schedule normal.

---

## Section 6 — El Arquitecto (Fase C)

El Arquitecto es el meta-agente del C-Level. Opera en 3 fases para mantener el safeguard humano:

### Fase C-1: Observar
- Lee workdocs de todos los pisos periódicamente (schedule semanal)
- Detecta: tareas que fallan repetidamente, pisos sin hooks para herramientas que usan, procesos manuales que aparecen en múltiples workdocs

### Fase C-2: Proponer
- Escribe un workdoc de propuesta en `workdocs/c_level/propuestas/YYYY-MM-DD-<mejora>.md`
- Postea resumen en el chat de C-Level: "Detecté X, propongo Y, ¿apruebas?"
- **Espera aprobación explícita** antes de ejecutar

### Fase C-3: Ejecutar (solo con aprobación)
- Edita `floors.toml` para crear/modificar pisos
- Escribe nuevas skills en `.claude/skills/`
- Configura hooks en `~/.claude/settings.json`
- Crea carpetas de workdocs y prompts base para el nuevo piso
- Todo ejecutado vía Claude Code CLI como cualquier otro agente

### Safeguard fundamental
El Arquitecto **siempre propone, nunca ejecuta cambios estructurales solo**. El humano aprueba cada modificación al sistema desde el chat de C-Level.

---

## Implementation Phases

### Fase A — Infraestructura (3-4 semanas)

1. Extender `floors.toml` con campos nuevos (`mission`, `workdocs_dir`, `schedule.*`)
2. Implementar `scheduler.py` con APScheduler
3. Implementar `agent_runner.py` — lanzar Claude Code con `CLAUDE_OFFICE_FLOOR_ID`
4. Extender hooks para pasar `floor_id` al backend
5. Implementar Chat API (`chat_messages` table + endpoints + WebSocket)
6. Agregar tab Chat al `RightSidebar`
7. Implementar `FloorUpdate` model + updates board (whiteboard modo 12)
8. Agregar updates bar al `BuildingView`
9. Implementar `CLevelView` básico (estado pisos + chat C-Level)

### Fase B — Primer piso real (1-2 semanas)

10. Configurar `dev_software` en `floors.toml` con tareas reales de Prometeo
11. Escribir prompt base del boss de Dev Software
12. Validar pipeline completo: scheduler → agente → workdoc → boss → update
13. Ajustar según comportamiento real

### Fase C — Pisos adicionales + Arquitecto (ongoing)

14. Activar `dev_hardware`, `customer_service`, `financiero`, `mkt_ventas`
15. Implementar `CLevelView` completo (visión + centros de costo + directivas)
16. Implementar El Arquitecto con flujo Observar → Proponer → Ejecutar

---

## What We Reuse (No Changes)

- `floors.toml` — solo se agregan campos, estructura existente intacta
- Hooks de Claude Code — solo se agrega `CLAUDE_OFFICE_FLOOR_ID` en el payload
- FastAPI + SQLite — se extiende, no se reescribe
- WebSocket — se reusa para chat y updates
- PixiJS canvas y todas las animaciones existentes
- `task_file_poller.py` — se extiende para detectar workdocs por piso
- Whiteboard (11 modos) — se agrega modo 12, no se modifica ninguno existente
- `RightSidebar` — se agrega tab, no se reescribe

## Ralph Implementation Structure

Cada fase se implementa como un run de `/ralph:ralph`. Ralph sigue el ciclo: diseño → código (TDD) → review → merge. Cada tarea en el PLAN.md tiene: test que falla → implementación → test verde → commit.

### Fase A — 3 runs Ralph

**Run A-1: Infraestructura de pisos y scheduler**
- Extender `floors.toml` + modelo `FloorConfig` con campos nuevos
- Implementar `scheduler.py` (APScheduler + FastAPI lifespan)
- Implementar `agent_runner.py` (lanzar Claude Code CLI con `CLAUDE_OFFICE_FLOOR_ID`)
- Extender hooks para pasar `floor_id`
- Tests: scheduler registra tareas desde floors.toml, agent_runner lanza proceso con env correcto

**Run A-2: Chat API + Updates Board**
- Tabla `chat_messages` en SQLite + endpoints REST + WebSocket broadcast
- `FloorUpdate` model + tabla `floor_updates` + endpoints
- Modo 12 del whiteboard (updates board)
- Updates bar en `BuildingView`
- Tests: CRUD de mensajes, broadcast de updates, filtros por prioridad

**Run A-3: Frontend — Chat tab + Updates bar**
- Tab Chat en `RightSidebar`
- Updates bar en `BuildingView`
- `CLevelView` básico (estado pisos + chat C-Level)
- Tests: smoke tests de componentes, websocket integration

### Fase B — 1 run Ralph

**Run B-1: Primer piso real (Dev Software)**
- `floors.toml` con tareas reales de Prometeo
- Prompt base del boss de Dev Software
- Validación end-to-end del pipeline completo
- Ajustes según comportamiento real

### Fase C — 2 runs Ralph (futuro)

**Run C-1: Pisos adicionales**
- Configurar los 4 pisos restantes en `floors.toml`
- Prompts base por departamento

**Run C-2: El Arquitecto**
- Meta-agente con flujo Observar → Proponer → Ejecutar
- Integración con C-Level chat para aprobaciones

---

## What We Build New

- `scheduler.py` — APScheduler integrado en FastAPI
- `agent_runner.py` — lanzador de sesiones Claude Code CLI
- Chat API + tabla SQLite + WebSocket events
- Tab Chat en RightSidebar
- `FloorUpdate` model + updates board (whiteboard mode 12)
- Updates bar en BuildingView
- `CLevelView` — nueva vista React (no PixiJS)
- El Arquitecto — meta-agente con prompt especializado (Fase C)
