# Ralph Coder Prompt — Run A-1 Task 6

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

## IMPORTANT: uv path and directory

- `uv` is not on the default PATH. Use full path `/Users/albertocastrobravo/.local/bin/uv`
- For backend tests: `/Users/albertocastrobravo/.local/bin/uv run pytest ...`
- For git commands: use project root `/Users/albertocastrobravo/Documents/MJM/panoptica`

## Extra notes

Your task is **Task 6: Implement scheduler.py** (the next ⬜ task in PLAN.md).

This task:
1. Creates `backend/tests/test_scheduler.py` with 5 failing tests (write them first, confirm failure)
2. Creates `backend/app/core/scheduler.py` with `FloorScheduler` class using APScheduler 3.x AsyncIOScheduler
3. Runs all 5 tests to confirm they pass
4. Runs full backend test suite to confirm no regressions
5. Commits

The exact test code and implementation are both in PLAN.md Task 6. Follow them precisely.

Key detail: the `test_scheduler_calls_agent_runner_on_trigger` test uses `AsyncMock` for the agent_runner and calls `scheduler._trigger_task(...)` directly (not via APScheduler). The `_trigger_task` method takes positional args: `floor_id, task, mission, workdocs_dir`.

APScheduler 3.11.2 is already installed (`apscheduler>=3.10.4` added in Task 1).

After completing Task 6, mark it ✅ in PLAN.md, commit everything, and exit. Do NOT pick up Task 7 or any other task.

## Continue from

Step **B2** in the workflow skill.
