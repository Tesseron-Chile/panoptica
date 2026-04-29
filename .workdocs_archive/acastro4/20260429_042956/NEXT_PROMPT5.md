# Ralph Coder Prompt — Run A-1 Task 4

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

- `uv` is not on the default PATH. Use full path `/Users/albertocastrobravo/.local/bin/uv` for all uv commands.
- For `uv run pytest` in hooks: run from the `hooks/` subdirectory: `cd /Users/albertocastrobravo/Documents/MJM/panoptica/hooks && /Users/albertocastrobravo/.local/bin/uv run pytest ...`
- For git commands: always use the project root `/Users/albertocastrobravo/Documents/MJM/panoptica`

## Extra notes

Your task is **Task 4: Propagate CLAUDE_OFFICE_FLOOR_ID through hooks** (the next ⬜ task in PLAN.md).

This task modifies the hooks package:
1. Creates `hooks/tests/test_floor_id_hook.py` with 2 failing tests (write them first, run to confirm failure)
2. Adds 3 lines to `hooks/src/claude_office_hooks/event_mapper.py` — after the team_name/teammate_name block, reads `os.environ.get("CLAUDE_OFFICE_FLOOR_ID")` and if set, adds it to `data["floor_id"]`
3. Runs the 2 new tests to confirm they pass
4. Runs full hooks test suite to confirm no regressions

The exact test code is in PLAN.md Task 4. The `os` import already exists in event_mapper.py — check the file to find the right insertion point (look for the team_name/teammate_name block, around line 368-374).

KEY: `map_event` signature is `(event_type, raw_data, session_id, strip_prefixes=None) -> dict | None`. The test uses dict access `event["data"]["floor_id"]` not attribute access.

After completing Task 4, mark it ✅ in PLAN.md, commit everything, and exit. Do NOT pick up Task 5 or any other task.

## Continue from

Step **B2** in the workflow skill.
