# Ralph Coder Prompt — Run A-1 Task 3

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

`uv` is not on the default PATH. Use full path `/Users/albertocastrobravo/.local/bin/uv` for all uv commands.

## Extra notes

Your task is **Task 3: Update floors.toml with Prometeo departments** (the next ⬜ task in PLAN.md).

This task replaces the entire content of `backend/floors.toml` with the Prometeo 6-department building config. The exact TOML content is in PLAN.md Task 3. After replacing, verify the config loads correctly using the python command in the plan, then run the existing floor config tests to confirm no regressions.

Note: `test_floor_config.py` tests the old Tesseron config — some may fail after this change. Check what those tests expect and update them to match the new Prometeo config if needed, ensuring the FloorConfig system still works correctly.

After completing Task 3, mark it ✅ in PLAN.md, commit everything, and exit. Do NOT pick up Task 4 or any other task.

## Continue from

Step **B2** in the workflow skill.
