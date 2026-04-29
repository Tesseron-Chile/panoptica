# Ralph Coder Prompt — Run A-1 Task 2

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

## IMPORTANT: uv path

`uv` is not on the default PATH. Use full path `/Users/albertocastrobravo/.local/bin/uv` for all uv commands. Example:
```bash
/Users/albertocastrobravo/.local/bin/uv run pytest tests/ -v
```

## Extra notes

Your task is **Task 2: Extend FloorConfig with department fields** (the next ⬜ task in PLAN.md).

This task:
1. Creates `backend/tests/test_floor_config_new_fields.py` with 10 failing tests (write and run them first to confirm failure)
2. Replaces the full content of `backend/app/core/floor_config.py` with the new implementation that adds `FloorSchedule`, `mission`, `workdocs_dir`, `schedule`, `is_c_level` fields and supports explicit `id` from TOML
3. Runs tests to confirm all 10 pass
4. Runs full backend test suite to confirm no regressions
5. Commits

The exact test code and implementation code are both in PLAN.md Task 2. Follow them precisely.

After completing Task 2, mark it ✅ in PLAN.md, commit everything, and exit. Do NOT pick up Task 3 or any other task.

## Continue from

Step **B2** in the workflow skill.
