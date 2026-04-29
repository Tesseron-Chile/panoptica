# Spec — Run A-1: Backend Infrastructure for Prometeo Company OS

**Date:** 2026-04-28
**Status:** Approved (from brainstorming session)
**Branch:** `ralph/bb32f8f1`

---

## Goal

Extend the panoptica backend with autonomous agent scheduling infrastructure. After this run, the backend can load Prometeo department definitions from `floors.toml`, schedule daily/weekly tasks per department via APScheduler, and launch Claude Code CLI sessions per floor with `CLAUDE_OFFICE_FLOOR_ID` routing through the existing hook pipeline.

## Scope

**7 backend tasks. No frontend changes. No WebSocket changes.**

| In scope | Out of scope |
|----------|--------------|
| APScheduler dependency | Chat API, Chat UI |
| FloorConfig extension (mission, schedule, workdocs_dir, is_c_level) | Updates Board / whiteboard mode 12 |
| floors.toml rewrite (Tesseron → Prometeo departments) | C-Level view |
| Hook propagation of CLAUDE_OFFICE_FLOOR_ID | PixiJS canvas changes |
| AgentRunner (fire-and-forget `claude -p` subprocess) | Frontend components |
| FloorScheduler (APScheduler cron registration) | Alembic migrations |
| FastAPI lifespan wiring | Database schema changes |

## Architecture Summary

```
Scheduler (APScheduler 3.x AsyncIOScheduler)
    ↓  reads floors.toml at startup, registers cron jobs
AgentRunner
    ↓  launches `claude -p <prompt>` with CLAUDE_OFFICE_FLOOR_ID in env
Claude Code CLI subprocess
    ↓  existing hooks fire on tool use / session events
Hooks (event_mapper.py)
    ↓  reads CLAUDE_OFFICE_FLOOR_ID from env, attaches floor_id to event payload
FastAPI Backend
    ↓  routes event to correct floor via floor_id field
WebSocket → PixiJS (unchanged)
```

**Key mechanism:** `CLAUDE_OFFICE_FLOOR_ID` is an environment variable injected by AgentRunner into each Claude Code subprocess. The existing hooks read it and attach `floor_id` to outgoing events. The backend already has `floor_id` in `EventData` — no model change needed.

**APScheduler 3.x** with `AsyncIOScheduler` runs on the existing FastAPI event loop. No extra threads. Daily jobs fire at 09:00, weekly jobs fire Mondays at 09:00.

**Fire-and-forget model:** AgentRunner does not await agent completion. The hooks handle the feedback loop back to the backend.

**FloorScheduler skips `is_c_level=True` floors** — C-Level has no autonomous scheduled tasks.

## Files Created / Modified

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `backend/pyproject.toml` | Add `apscheduler>=3.10.4` dependency |
| Modify | `backend/app/core/floor_config.py` | Add `FloorSchedule`, `mission`, `workdocs_dir`, `schedule`, `is_c_level`; parse explicit `id` field |
| Modify | `backend/floors.toml` | Replace Tesseron content with Prometeo departments (6 floors) |
| Modify | `hooks/src/claude_office_hooks/event_mapper.py` | Read `CLAUDE_OFFICE_FLOOR_ID` from env and attach to outgoing event |
| Create | `backend/app/core/agent_runner.py` | `run_floor_task()` — launches `claude -p` subprocess |
| Create | `backend/app/core/scheduler.py` | `FloorScheduler` — APScheduler wrapper; reads floors, registers cron jobs |
| Modify | `backend/app/main.py` | Start/stop `FloorScheduler` in FastAPI lifespan |
| Create | `backend/tests/test_floor_config_new_fields.py` | 10 unit tests for FloorConfig extension |
| Create | `backend/tests/test_agent_runner.py` | 4 unit tests for AgentRunner (subprocess mocked) |
| Create | `backend/tests/test_scheduler.py` | 5 unit tests for FloorScheduler job registration |
| Create | `hooks/tests/test_floor_id_hook.py` | 2 unit tests for floor_id propagation in event_mapper |

## Success Criteria

All criteria are programmatically verifiable:

1. **APScheduler importable:**
   ```bash
   cd backend && uv run python -c "from apscheduler.schedulers.asyncio import AsyncIOScheduler; print('ok')"
   ```
   Exits 0, prints `ok`.

2. **FloorConfig tests pass:**
   ```bash
   cd backend && uv run pytest tests/test_floor_config_new_fields.py -v
   ```
   All 10 tests pass.

3. **AgentRunner tests pass:**
   ```bash
   cd backend && uv run pytest tests/test_agent_runner.py -v
   ```
   All 4 tests pass.

4. **Scheduler tests pass:**
   ```bash
   cd backend && uv run pytest tests/test_scheduler.py -v
   ```
   All 5 tests pass.

5. **Hook floor_id tests pass:**
   ```bash
   cd hooks && uv run pytest tests/test_floor_id_hook.py -v
   ```
   Both tests pass.

6. **Server starts with scheduler:**
   ```bash
   cd backend && uv run uvicorn app.main:app --port 8001 &
   sleep 3
   curl -s http://localhost:8001/health
   ```
   Returns `{"status":"ok"}` and logs contain "FloorScheduler started".

7. **Full checkall passes:**
   ```bash
   make checkall
   ```
   Format, lint, typecheck, and tests all pass from repo root.
