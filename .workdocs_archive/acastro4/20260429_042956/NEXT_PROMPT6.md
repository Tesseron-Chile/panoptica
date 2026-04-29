# Ralph Coder Prompt — Run A-1 Task 5

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
- For backend tests: `cd /Users/albertocastrobravo/Documents/MJM/panoptica/backend && /Users/albertocastrobravo/.local/bin/uv run pytest ...`
- For git commands: use project root `/Users/albertocastrobravo/Documents/MJM/panoptica`

## Extra notes

Your task is **Task 5: Implement agent_runner.py** (the next ⬜ task in PLAN.md).

This task:
1. Creates `backend/tests/test_agent_runner.py` with 4 failing tests (write them first, confirm failure)
2. Creates `backend/app/core/agent_runner.py` with `build_floor_prompt()` and `AgentRunner` class
3. Runs all 4 tests to confirm they pass
4. Commits

The exact test code and implementation are both in PLAN.md Task 5. Follow them precisely.

Key detail: the test mocks `asyncio.create_subprocess_exec` via `patch("app.core.agent_runner.asyncio.create_subprocess_exec", new_callable=AsyncMock)`. The actual `create_subprocess_exec` call uses keyword arguments: `env=env` and `cwd=cwd`.

After completing Task 5, mark it ✅ in PLAN.md, commit everything, and exit. Do NOT pick up Task 6 or any other task.

## Continue from

Step **B2** in the workflow skill.
