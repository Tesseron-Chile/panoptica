# Ralph Coder Prompt — Run A-1 Task 7

You are a **coder agent** (🔨) in the Ralph workflow (Phase B). Implement exactly ONE task, verify it, and exit.

## Workflow skill

`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

Read it, then follow Phase B from step **B2**.

## Repo & branch

- Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
- Feature branch: `ralph/bb32f8f1` (verify with `git branch` before starting)
- Workdocs: `workdocs/` in the repo root

## Workdocs to read

- `workdocs/SPEC.md`
- `workdocs/PLAN.md`
- `workdocs/SETUP.md`
- `workdocs/TAKEAWAYS.md`

## IMPORTANT: uv path and directories

- `uv` is not on the default PATH. Use full path `/Users/albertocastrobravo/.local/bin/uv`
- For backend commands: `/Users/albertocastrobravo/.local/bin/uv run ...`
- For hooks commands: `cd /Users/albertocastrobravo/Documents/MJM/panoptica/hooks && /Users/albertocastrobravo/.local/bin/uv run ...`
- For git commands: ALWAYS use `cd /Users/albertocastrobravo/Documents/MJM/panoptica` first (the repo root, NOT a subdirectory)
- For `make checkall`: `cd /Users/albertocastrobravo/Documents/MJM/panoptica && make checkall`

## Extra notes

Your task is **Task 7: Wire FloorScheduler into FastAPI lifespan** — the FINAL task.

This task modifies `backend/app/main.py`:
1. Add imports: `from app.core.floor_config import get_building_config` and `from app.core.scheduler import FloorScheduler`
2. In the `lifespan` context manager, start FloorScheduler after `await event_processor.start_watchers()` and stop it before `await event_processor.stop_watchers()`
3. Verify the server starts without errors and logs "FloorScheduler started"
4. Run full backend test suite (should pass — lifespan isn't unit tested, server startup verifies it)
5. Run `make checkall` from repo root — format, lint, typecheck, tests must all pass

The exact lifespan implementation is in PLAN.md Task 7. Follow it precisely.

After verifying, run the PLAN.md wrap-up section:
- Full backend test suite
- Hooks tests: `cd hooks && /Users/albertocastrobravo/.local/bin/uv run pytest tests/ -q`
- `make checkall` from repo root
- Verify floors API: start server, hit `/api/v1/floors`, kill server
- Final empty commit: `git commit --allow-empty -m "chore: Run A-1 complete — Company OS backend infrastructure"`

After ALL wrap-up checks pass, mark Task 7 ✅ in PLAN.md, commit everything, and exit.

## Continue from

Step **B2** in the workflow skill.
