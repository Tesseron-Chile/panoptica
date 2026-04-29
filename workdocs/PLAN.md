# PLAN — Run B-1: Primer Piso Real (Dev Software)

## What already exists (no changes needed)
- `floors.toml` — all floors with mission, workdocs_dir, schedule ✅
- `scheduler.py` — registers cron jobs and is wired into FastAPI lifespan ✅
- `agent_runner.py` — launches `claude -p` with floor context ✅
- Chat API + Floor Updates API ✅

## Execution Order

```
T0 (trigger endpoint) → T1 (self-reporting prompt) → T2 (workdoc watcher) → T3 (boss prompt file) → T4 (tests) → T5 (verify)
```

---

### T0 — Manual Trigger Endpoint ✅

**Modify** `backend/app/api/routes/floors.py`:
- Add `POST /floors/{floor_id}/tasks/trigger`
- Body: `TriggerTaskRequest(task: str | None = None)`
- If no task: use first daily task from floor config
- Creates an `AgentRunner`, fires `run_floor_task(...)` as background task
- Returns 202 `{floor_id, task, triggered_at}`

**Modify** `backend/app/main.py`:
- Pass `AgentRunner` instance into app state so it's reusable

---

### T1 — Self-Reporting Agent Prompt ✅

**Modify** `backend/app/core/agent_runner.py`:
- Update `_PROMPT_TEMPLATE` to add at the end:
  ```
  5. Al terminar, llama a la API de updates para reportar el resultado:
     POST http://localhost:8000/api/v1/floors/{floor_id}/updates
     Body JSON: {{"title": "<resumen en 1 línea>", "priority": "info|alert|critical", "body": "<detalle>"}}
     Usa prioridad "critical" si encontraste [CRÍTICO], "alert" si hay advertencias, "info" para éxito normal.
  ```

---

### T2 — Workdoc Watcher ✅

**Create** `backend/app/core/workdoc_watcher.py`:
- Polls `workdocs/<floor_id>/` every 60s for new `.md` files
- Tracks seen files in-memory (or by mtime)
- When new file detected: calls `AgentRunner.run_floor_task()` with
  `task="Revisa el workdoc {path} y publica un floor update con el resumen"`
- Uses the same AgentRunner pattern as scheduler

**Modify** `backend/app/main.py`:
- Create `WorkdocWatcher` instance in lifespan startup
- Pass same `AgentRunner` instance
- Call `watcher.start()` / `watcher.stop()` in lifespan

---

### T3 — Dev Software Boss Prompt ✅

**Create** `backend/prompts/` directory

**Create** `backend/prompts/dev_software_boss.md`:
- Specific context for Prometeo dev software department
- Knows about: panoptica repo, prometeo-core, GitHub PRs, Linear tickets
- Instructs boss to: check CI status, review open PRs, report blockers

**Modify** `backend/app/core/agent_runner.py`:
- Add `_load_boss_prompt(floor_id)` — reads `prompts/<floor_id>_boss.md` if exists, else uses generic template
- Use this in `build_floor_prompt()`

---

### T4 — Tests ✅

**Create** `backend/tests/test_trigger_endpoint.py`:
- `test_trigger_known_floor` — POST /floors/dev_software/tasks/trigger → 202
- `test_trigger_unknown_floor` — POST /floors/unknown/tasks/trigger → 404
- `test_trigger_custom_task` — POST with body `{task: "custom task"}` → uses that task

**Create** `backend/tests/test_workdoc_watcher.py`:
- `test_new_file_triggers_runner` — write file to workdocs dir, watcher detects it, AgentRunner called
- `test_seen_files_not_re-triggered` — same file not triggered twice

---

### T5 — Verify ✅

```bash
cd backend && uv run pytest tests/test_trigger_endpoint.py tests/test_workdoc_watcher.py -v
cd backend && make checkall
```
