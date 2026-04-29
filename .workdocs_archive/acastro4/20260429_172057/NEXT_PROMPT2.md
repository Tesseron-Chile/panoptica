# NEXT_PROMPT2 — Coder (Phase B, iteration 2)

You are a **coder agent (🔨)** in the Ralph workflow. Read the Ralph skill and the workdocs below, then follow Phase B starting from **B2**.

## Ralph skill

Read in full before doing anything else:

- `~/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

## Workdocs to read (in order)

All paths relative to `/Users/m.cadilecaceres/dev/tesseron/panoptica`:

1. `workdocs/USER_PROMPT.md`
2. `workdocs/SPEC.md`
3. `workdocs/PLAN.md`
4. `workdocs/SETUP.md`
5. `workdocs/TAKEAWAYS.md`  ← contains important learnings from coder 1, must read

## Branch

`feature/ralph-panoptica-spec-a`. Verify before any edit. Do NOT create a new branch.

## Your task

Claim **`plan-task-2`** (Extend Session with run_id/role/task_id). plan-task-1 is ✅.

The exact implementation lives in section **"Task 2: Extend Session with run_id / role / task_id"** of:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

Read that section first. It shows failing tests, exact edits to `backend/app/models/sessions.py`, and the commit message.

## Process

1. **B2:** Read skill + workdocs; verify branch.
2. **B3:** Mark `plan-task-2` as `- [🔧]` in `workdocs/PLAN.md` and commit immediately (`chore(plan): claim plan-task-2`).
3. **B4:** Verify tooling: `cd backend && uv run pytest --collect-only -q 2>&1 | tail -3`.
4. **B5:** TDD: append failing tests to `backend/tests/test_models_runs.py` per plan section, run them (expect fail), edit `backend/app/models/sessions.py` to add `run_id`, `role`, `task_id`, re-run (expect pass). Commit per plan-doc commit message.
5. **B6:** Self-review diff.
6. **B7:** `cd backend && uv run pytest tests/test_models_runs.py -v` green.
7. **B8:** Quick `grep -rn "Session(" backend/` — ensure no existing callers break because `Session` now has `ConfigDict(alias_generator=...)`. If anything breaks, fix it minimally.
8. **B9:** Full suite green: `cd backend && uv run pytest tests/ -q`.
9. **B10:** Add a short learning to `TAKEAWAYS.md` only if non-obvious.
10. **B11:** Mark `- [x] plan-task-2: ... — Session: completed cleanly` in PLAN.md. Commit all. Exit.

## Extra notes

- Coder 1 already added Role to `backend/app/models/runs.py`. Import `Role` from there.
- The existing `Session` class does NOT yet use `alias_generator` — adding it is part of this task. Confirm by reading current `sessions.py` before editing.
- If adding `alias_generator` to `Session` breaks other tests (`test_api.py`, `test_state_machine.py`), fix them minimally — the camelCase alias is the correct direction per project convention.
- Use Python kwarg names (snake_case) in tests (e.g., `run_id=...`), not the alias form, since `populate_by_name=True`.
- Use `uv run pytest`. Commit frequently.
- Do NOT modify unrelated files.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
