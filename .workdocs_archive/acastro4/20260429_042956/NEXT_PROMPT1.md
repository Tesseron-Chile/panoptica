# Ralph Designer Prompt — Run A-1

You are the **designer agent** (🎨) in the Ralph workflow. Your job is to produce the workdocs needed before implementation begins.

## Key context: Design already done

A full brainstorming session already produced an approved spec and plan. Your Phase A role is to:
1. **Adapt** the existing documents into workdocs format
2. **Write SETUP.md** (the one missing piece)
3. **Seed TAKEAWAYS.md**
4. **Commit all workdocs**

Do NOT re-do discovery or redesign anything. The design is approved.

## Workflow skill location

`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

Read it, then continue from **A11** (confirm branch), skip A12 (discovery done), go to A13 (produce workdocs), A15 (SETUP.md), A16 (self-review), and commit.

## Repo & branch

- Primary repo: `/Users/albertocastrobravo/Documents/MJM/panoptica`
- Feature branch: `ralph/bb32f8f1` (you should already be on this branch — verify)
- Workdocs path: `workdocs/` in the primary repo

## Source documents (READ THESE)

1. **Design spec:** `docs/superpowers/specs/2026-04-28-prometeo-company-os-design.md`
2. **Implementation plan:** `docs/superpowers/plans/2026-04-28-company-os-run-a1.md`
3. **USER_PROMPT.md:** `workdocs/USER_PROMPT.md`

## What to produce

### workdocs/SPEC.md

Write a focused spec for **Run A-1 only** (not the full Company OS). Include:

- **Goal:** what this run builds
- **Scope:** 7 backend tasks, no frontend changes
- **Architecture summary:** CLAUDE_OFFICE_FLOOR_ID routing, APScheduler, AgentRunner
- **Files created/modified** (list from the plan's File Map)
- **Success criteria** (programmatically verifiable):
  1. `uv run python -c "from apscheduler.schedulers.asyncio import AsyncIOScheduler; print('ok')"` exits 0
  2. `uv run pytest tests/test_floor_config_new_fields.py -v` — all 10 tests pass
  3. `uv run pytest tests/test_agent_runner.py -v` — all 4 tests pass
  4. `uv run pytest tests/test_scheduler.py -v` — all 5 tests pass
  5. `uv run pytest tests/test_floor_id_hook.py -v` (from hooks/) — both tests pass
  6. `uv run uvicorn app.main:app --port 8001 &; sleep 3; curl -s http://localhost:8001/health` returns `{"status":"ok"}` and logs contain "FloorScheduler started"
  7. `make checkall` from repo root passes (format, lint, typecheck, tests)

### workdocs/PLAN.md

Copy the exact content of `docs/superpowers/plans/2026-04-28-company-os-run-a1.md` into workdocs/PLAN.md, **replacing all `- [ ]` checkboxes with `⬜`** and all checked boxes with `✅`. Keep the task names and structure identical. Add a status marker line after each task header: `Status: ⬜`.

Actually, do it like this for each Task:

```
## Task N: Name
**Status:** ⬜
...steps...
```

### workdocs/SETUP.md

Write project-specific dev environment setup for coder agents. Cover:

```
# Setup — Run A-1

## Prerequisites
- Python 3.13 (check: `python3 --version`)
- uv (check: `uv --version`)
- Backend deps: `cd backend && uv sync`
- Hooks deps: `cd hooks && uv sync`

## Running Tests

### Backend tests
cd backend && uv run pytest tests/ -v

### Hooks tests
cd hooks && uv run pytest tests/ -v

### Single test
cd backend && uv run pytest tests/test_floor_config_new_fields.py -v

## Running the backend
cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

## Checking health
curl http://localhost:8000/health
# Expected: {"status":"ok"}

## Full checkall
make checkall  # from repo root — runs lint, typecheck, tests for all components

## Key files
- backend/floors.toml — building config (being replaced with Prometeo in Task 3)
- backend/app/core/floor_config.py — FloorConfig model (being extended in Task 2)
- hooks/src/claude_office_hooks/event_mapper.py — event mapper (being patched in Task 4)
- backend/app/main.py — FastAPI app + lifespan (being updated in Task 7)

## APScheduler note
APScheduler 3.x is being added as a dep in Task 1. After `cd backend && uv sync`,
verify: `uv run python -c "from apscheduler.schedulers.asyncio import AsyncIOScheduler; print('ok')"`
```

Actually, explore the codebase to verify the actual setup commands work before writing them.

### workdocs/TAKEAWAYS.md

Seed with:
```
# Takeaways

## Phase A Design Decisions

- Run A-1 implements backend infrastructure only — no frontend, no WebSocket changes
- CLAUDE_OFFICE_FLOOR_ID is the key routing mechanism: AgentRunner injects it into env, existing hooks propagate it, backend routes events to correct floor
- APScheduler 3.x with AsyncIOScheduler chosen (runs on existing FastAPI event loop, no extra threads)
- fire-and-forget subprocess model: AgentRunner does not await agent completion (hooks handle the feedback loop)
- FloorScheduler skips floors with is_c_level=True (C-Level has no autonomous scheduled tasks)
- EventData.floor_id already exists in backend/app/models/events.py — no model change needed for hooks integration
- floors.toml replaces Tesseron products with Prometeo departments — breaking change to building config, but no running services depend on specific floor IDs

## Known Issues

- Local main is 1 commit ahead of origin/main (spec doc commit from brainstorming). Need to push main before creating PR in Phase C.
- Plan is at docs/superpowers/plans/ not workdocs/ — coder agents should use workdocs/PLAN.md

## Workflow Notes

- Design was done in a prior brainstorming session and approved by user — designer agent adapted existing docs rather than discovering from scratch
```

## After writing workdocs

1. Verify all files exist and look correct
2. Run `make checkall` from repo root to confirm baseline (before any code changes)
3. Commit all workdocs: `git add workdocs/ && git commit -m "chore(workdocs): init ralph/bb32f8f1 workdocs for Run A-1"`
4. Tell the orchestrator: "Phase A complete. Workdocs committed. SPEC.md, PLAN.md, SETUP.md, TAKEAWAYS.md are ready in workdocs/."

## Important

- You are on branch `ralph/bb32f8f1` — verify with `git branch`
- Do NOT modify any source code — that's the coder's job
- Do NOT install dependencies — just verify they can be installed
- The plan has 7 tasks — do not trim or rewrite them
