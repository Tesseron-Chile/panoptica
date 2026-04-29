# Ralph Coder Prompt — Run A-1 Task 1

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

## Extra notes

Your task is **Task 1: Add APScheduler dependency** (the first ⬜ task in PLAN.md).

This is the simplest task: add `"apscheduler>=3.10.4"` to `backend/pyproject.toml` dependencies, run `uv sync`, verify the import, and commit. No tests to write — just dependency installation and verification.

After completing Task 1, mark it ✅ in PLAN.md, commit everything, and exit. Do NOT pick up Task 2 or any other task.

## Continue from

Step **B2** in the workflow skill.
