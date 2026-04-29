# Setup — Run A-1

## Prerequisites

- **Python 3.13** — check: `python3 --version`
- **uv** — check: `uv --version`
- **Node.js / bun** — only needed for `make checkall` (frontend lint/typecheck); not required for backend-only tasks

## Installing Dependencies

### Backend
```bash
cd backend && uv sync
```

### Hooks
```bash
cd hooks && uv sync
```

### All at once (backend + frontend + hooks)
```bash
make install   # from repo root
```

## Running Tests

### Backend tests
```bash
cd backend && uv run pytest tests/ -v
```

### Hooks tests
```bash
cd hooks && uv run pytest tests/ -v
```

### Single test file
```bash
cd backend && uv run pytest tests/test_floor_config_new_fields.py -v
```

### Single test function
```bash
cd backend && uv run pytest tests/test_floor_config_new_fields.py::test_explicit_id_is_used -v
```

## Running the Backend

```bash
cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Checking Health

```bash
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

## Full Checkall

```bash
make checkall   # from repo root — runs lint, typecheck, tests for backend + frontend
```

For backend only:
```bash
cd backend && make checkall
```

## Key Files

| File | Role | Run A-1 action |
|------|------|---------------|
| `backend/pyproject.toml` | Backend dependencies | Adding `apscheduler>=3.10.4` (Task 1) |
| `backend/floors.toml` | Building/floor config | Replacing Tesseron with Prometeo departments (Task 3) |
| `backend/app/core/floor_config.py` | FloorConfig model + loader | Extending with mission, schedule, workdocs_dir, is_c_level (Task 2) |
| `hooks/src/claude_office_hooks/event_mapper.py` | Hook event mapper | Adding CLAUDE_OFFICE_FLOOR_ID propagation (Task 4) |
| `backend/app/main.py` | FastAPI app + lifespan | Wiring FloorScheduler startup/shutdown (Task 7) |
| `backend/app/core/agent_runner.py` | New — AgentRunner service | Created in Task 5 |
| `backend/app/core/scheduler.py` | New — FloorScheduler service | Created in Task 6 |

## APScheduler Note

APScheduler 3.x is being added as a dependency in Task 1. After `cd backend && uv sync`, verify:

```bash
cd backend && uv run python -c "from apscheduler.schedulers.asyncio import AsyncIOScheduler; print('ok')"
```

Expected output: `ok`

## EventData.floor_id

The `floor_id` field already exists in `backend/app/models/events.py` (in the `EventData` model). No model change is needed for hooks integration — the hooks just need to populate the field via the `CLAUDE_OFFICE_FLOOR_ID` environment variable.
