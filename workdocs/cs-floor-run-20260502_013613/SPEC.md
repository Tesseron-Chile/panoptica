# SPEC — Customer Service Floor

## Problem Description

Prometeo's Company OS (panoptica) has multiple autonomous floors but no customer-facing support floor. Emails to `prometeo@tesseron.cl` are unmonitored. The Customer Service floor will autonomously triage the inbox, classify each email, act per category, and maintain full traceability via workdocs and the Updates Board.

**Current state:** The `customer_service` floor entry exists in `floors.toml` with generic daily/weekly tasks and a generic boss prompt. The vault directory exists but is empty. The scheduler supports `daily` and `weekly` schedules only.

**Target state:** The CS floor monitors `prometeo@tesseron.cl` every 30 minutes via Gmail MCP, classifies emails into 4 categories, takes category-specific actions, saves a workdoc per interaction, and posts updates with appropriate priority.

## Requirements

### Functional

1. **Inbox polling (every 30 min):** APScheduler fires a task that reads emails without the `cs-procesado` Gmail label.
2. **Per-email processing:** Each email spawns an independent Claude session via `agent_runner.py` (no modifications to agent_runner).
3. **Email classification** into 4 categories:
   - **Bug** — Create Linear ticket (project "Prometeo") + reply to customer. If info is insufficient, request it in the reply.
   - **Consulta** — Read Obsidian vault (`vault/customer_service/`) for relevant knowledge, compose reply.
   - **Feature Request** — Send standard acknowledgment reply.
   - **Spam** — No action, no reply. Log in workdoc only.
4. **Post-processing (mandatory for every email):**
   - Save a workdoc to `workdocs/customer_service/YYYY-MM-DD-<subject-slug>.md`
   - Apply Gmail label `cs-procesado`
   - Post update to Updates Board via `POST /api/v1/floors/customer_service/updates`
5. **Updates Board priorities:**
   - `critical` — incident keywords ("caído", "no funciona nada"), VIP client, or 3+ bugs in 30 min
   - `alert` — each individual bug
   - `info` — consulta answered, feature request received
   - `report` — daily summary at 09:00
6. **Manual triggers:** Chat command, C-Level directive, API `POST /floors/customer_service/tasks/trigger`
7. **Obsidian vault** with placeholder notes for the agent to read when answering consultas.

### Non-Functional

- Failures are isolated per email — one failing email does not block others in the same cycle.
- No modifications to `agent_runner.py`, hooks, WebSocket, or PixiJS canvas.
- Boss prompt lives at `backend/prompts/customer_service_boss.md` (matching `_load_floor_prompt` convention).

### Security

- No raw customer data (emails, PII) in committed code or boss prompt — only in runtime workdocs.
- Gmail MCP credentials managed externally (not in repo).

## Assumptions

- Gmail MCP tools (`mcp__claude_ai_Gmail__*`) are available to the Claude session at runtime.
- Linear MCP tools (`mcp__plugin_linear_linear__*`) are available to the Claude session at runtime.
- The `cs-procesado` Gmail label will be created by the agent if it doesn't exist (using Gmail MCP `create_label`).
- The Obsidian vault starts with placeholder content — real content is populated by humans over time.
- The `Read` tool is sufficient for vault access (no embeddings or vector search).

## Existing Architecture

### Key files

| File | Purpose |
|------|---------|
| `backend/app/core/floor_config.py` | `FloorConfig`, `FloorSchedule`, `BuildingConfig` models + TOML loader |
| `backend/app/core/scheduler.py` | `FloorScheduler` — registers daily/weekly cron jobs per floor |
| `backend/app/core/agent_runner.py` | `AgentRunner` — launches Claude CLI sessions for floor tasks |
| `backend/floors.toml` | Building/floor configuration |
| `backend/prompts/<floor_id>_boss.md` | Per-floor boss context (prepended to agent prompt) |
| `backend/app/api/routes/floors.py` | `GET /floors` + `POST /floors/{floor_id}/tasks/trigger` |
| `backend/app/api/routes/floor_updates.py` | Updates Board CRUD endpoints |

### FloorSchedule model (current)

```python
class FloorSchedule(BaseModel):
    daily: list[str] = Field(default_factory=list)
    weekly: list[str] = Field(default_factory=list)
```

### FloorConfig model (current)

```python
class FloorConfig(BaseModel):
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
```

### Scheduler (current)

Only registers `CronTrigger` jobs for `daily` and `weekly`. No interval-based scheduling.

## Proposed Architecture

### Model extensions

**FloorSchedule** — add:
```python
every_30min: list[str] = Field(default_factory=list)
```

**FloorConfig** — add:
```python
knowledge_vault: str = ""
inbox_email: str = ""
gmail_label: str = ""
linear_project: str = ""
```

### Scheduler extension

Add `IntervalTrigger(minutes=30)` registration for `floor.schedule.every_30min` tasks in `_register_jobs`. Import `IntervalTrigger` from `apscheduler.triggers.interval`.

### floors.toml update

Replace the `customer_service` entry with (using inline dot notation for schedule, since table header syntax only works for the last `[[floors]]` entry):
```toml
[[floors]]
id             = "customer_service"
name           = "Customer Service"
floor_number   = 3
accent         = "#10b981"
icon           = "🎧"
mission        = "Atender clientes de prometeo@tesseron.cl, resolver bugs y responder consultas"
workdocs_dir   = "workdocs/customer_service/"
knowledge_vault = "vault/customer_service/"
inbox_email    = "prometeo@tesseron.cl"
gmail_label    = "cs-procesado"
linear_project = "Prometeo"
schedule.every_30min = ["revisar inbox prometeo@tesseron.cl"]
schedule.daily = ["reporte de casos del día"]
```

### Boss prompt

Rewrite `backend/prompts/customer_service_boss.md` with:
- Floor identity and inbox details
- 4 classification rules with action instructions per category
- Bug: create Linear ticket + reply (ask for missing info if needed)
- Consulta: read vault + reply
- Feature request: standard acknowledgment
- Spam: no action
- 3 mandatory post-processing steps (workdoc + label + update)
- Update priority rules
- Response language: match the client's language

### Vault structure

```
vault/customer_service/
├── .obsidian/
│   └── app.json
├── producto/
│   ├── que-es-prometeo.md
│   ├── funcionalidades.md
│   └── roadmap-publico.md
├── precios/
│   ├── planes.md
│   └── faq-precios.md
├── soporte/
│   ├── bugs-conocidos.md
│   ├── como-reportar.md
│   └── tiempos-respuesta.md
└── empresa/
    ├── mision-vision.md
    └── contacto.md
```

## Testing Strategy

- **Unit tests** for model extensions (`FloorSchedule.every_30min`, `FloorConfig` new fields, TOML parsing)
- **Unit tests** for scheduler `every_30min` job registration (mock scheduler, verify `IntervalTrigger` used)
- **Integration test** for `floors.toml` loading (parse real file, verify CS floor has correct config)
- **Endpoint test** for trigger with CS floor (existing pattern in `test_trigger_endpoint.py`)
- **File existence tests** for vault structure and boss prompt

No browser-based UAT needed — this feature is entirely backend (no frontend changes).

## Success Criteria

### SC-1: FloorSchedule supports every_30min
```bash
cd backend && uv run python3 -c "
from app.core.floor_config import FloorSchedule
s = FloorSchedule(every_30min=['task1', 'task2'])
assert s.every_30min == ['task1', 'task2'], 'every_30min field missing'
s2 = FloorSchedule()
assert s2.every_30min == [], 'default should be empty list'
print('SC-1 PASS')
"
```

### SC-2: FloorConfig has new fields
```bash
cd backend && uv run python3 -c "
from app.core.floor_config import FloorConfig
f = FloorConfig(name='Test', floor_number=1, accent='#fff', icon='x',
    knowledge_vault='vault/test/', inbox_email='a@b.com',
    gmail_label='processed', linear_project='Proj')
assert f.knowledge_vault == 'vault/test/'
assert f.inbox_email == 'a@b.com'
assert f.gmail_label == 'processed'
assert f.linear_project == 'Proj'
print('SC-2 PASS')
"
```

### SC-3: TOML parser handles new fields
```bash
cd backend && uv run python3 -c "
from app.core.floor_config import load_building_config
cfg = load_building_config(toml_string='''
[[floors]]
id = \"cs\"
name = \"CS\"
floor_number = 1
accent = \"#000\"
icon = \"x\"
knowledge_vault = \"vault/cs/\"
inbox_email = \"a@b.com\"
gmail_label = \"done\"
linear_project = \"P\"
schedule.every_30min = [\"check inbox\"]
schedule.daily = [\"report\"]
''')
f = cfg.get_floor('cs')
assert f.knowledge_vault == 'vault/cs/'
assert f.inbox_email == 'a@b.com'
assert f.gmail_label == 'done'
assert f.linear_project == 'P'
assert f.schedule.every_30min == ['check inbox']
print('SC-3 PASS')
"
```

### SC-4: Scheduler registers interval jobs
```bash
cd backend && uv run python3 -c "
from app.core.floor_config import FloorConfig, FloorSchedule
from app.core.scheduler import FloorScheduler
from unittest.mock import AsyncMock
floor = FloorConfig(
    id='cs', name='CS', floor_number=1, accent='#000', icon='x',
    mission='test', workdocs_dir='wd/',
    schedule=FloorSchedule(every_30min=['task1'], daily=[], weekly=[])
)
runner = AsyncMock()
s = FloorScheduler([floor], agent_runner=runner)
assert s.job_count() >= 1, f'Expected at least 1 job, got {s.job_count()}'
print('SC-4 PASS')
"
```

### SC-5: floors.toml CS floor has correct config
```bash
cd backend && uv run python3 -c "
from app.core.floor_config import get_building_config
get_building_config.cache_clear()
cfg = get_building_config()
cs = cfg.get_floor('customer_service')
assert cs is not None, 'customer_service floor not found'
assert cs.inbox_email == 'prometeo@tesseron.cl'
assert cs.gmail_label == 'cs-procesado'
assert cs.linear_project == 'Prometeo'
assert cs.knowledge_vault == 'vault/customer_service/'
assert 'revisar inbox' in cs.schedule.every_30min[0]
assert len(cs.schedule.daily) >= 1
print('SC-5 PASS')
"
```

### SC-6: Vault structure exists
```bash
test -d vault/customer_service/.obsidian && \
test -d vault/customer_service/producto && \
test -d vault/customer_service/precios && \
test -d vault/customer_service/soporte && \
test -d vault/customer_service/empresa && \
test -f vault/customer_service/producto/que-es-prometeo.md && \
test -f vault/customer_service/precios/planes.md && \
test -f vault/customer_service/soporte/bugs-conocidos.md && \
test -f vault/customer_service/empresa/contacto.md && \
echo "SC-6 PASS"
```

### SC-7: Boss prompt contains classification rules
```bash
rg -q "Bug" backend/prompts/customer_service_boss.md && \
rg -q "Consulta" backend/prompts/customer_service_boss.md && \
rg -q "Feature" backend/prompts/customer_service_boss.md && \
rg -q "Spam" backend/prompts/customer_service_boss.md && \
rg -q "cs-procesado" backend/prompts/customer_service_boss.md && \
rg -q "Linear" backend/prompts/customer_service_boss.md && \
echo "SC-7 PASS"
```

### SC-8: All tests pass
```bash
cd backend && uv run pytest --tb=short -q
```

## Coding Guidelines

- Follow existing patterns: model extensions mirror current `FloorConfig`/`FloorSchedule` style.
- Boss prompt in Spanish (matches existing prompts and target audience).
- Vault placeholder notes in Spanish with `[TODO: ...]` markers for human-editable content.
- Do not modify `agent_runner.py` — floor-specific details go in the boss prompt.
