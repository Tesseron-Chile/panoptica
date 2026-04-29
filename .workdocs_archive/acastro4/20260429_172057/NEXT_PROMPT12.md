# NEXT_PROMPT12 — Coder (Phase B, iteration 12)

You are a **coder agent (🔨)** in the Ralph workflow. Read the Ralph skill and workdocs, then follow Phase B starting from **B2**.

## Ralph skill

- `~/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

## Workdocs to read (in order)

All paths relative to `/Users/m.cadilecaceres/dev/tesseron/panoptica`:

1. `workdocs/USER_PROMPT.md`
2. `workdocs/SPEC.md`
3. `workdocs/PLAN.md`
4. `workdocs/SETUP.md`
5. `workdocs/TAKEAWAYS.md`

## Branch

`feature/ralph-panoptica-spec-a`. Verify. Do NOT create a new branch.

## Your task

Claim **`plan-task-12`** (Hooks forward RALPH_* env on session_start). plan-task-1..11 are ✅.

**IMPORTANT: This task operates in `hooks/`, NOT `backend/`.** Noted in TAKEAWAYS.md.

Implementation spec lives in section **"Task 12: Hooks forward RALPH_* env on session_start"** of:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

Read that section first. Forwards `RALPH_RUN_ID`, `RALPH_ROLE`, `RALPH_TASK_ID`, `RALPH_PRIMARY_REPO` via SESSION_START payload data.

## Process

1. **B2:** Read skill + workdocs; verify branch.
2. **B3:** Mark `plan-task-12` as `- [🔧]`; commit `chore(plan): claim plan-task-12`.
3. **B4:** `cd hooks && uv run pytest -q 2>&1 | tail -3` (sanity).
4. **B5:** Follow plan-doc steps:
   - `grep -rn "session_start\|SESSION_START" hooks/src` to locate payload builder.
   - Edit to forward the four RALPH_* env vars.
   - Add/update test in `hooks/tests/` asserting env appears in payload.
   - Run tests, expect pass.
   - Commit per plan-doc message.
5. **B6:** Self-review.
6. **B7:** `cd hooks && uv run pytest -v` green.
7. **B8:** PLAN.md sanity.
8. **B9:** `cd backend && uv run pytest tests/ -q` — backend unchanged, still 298+ passed.
9. **B10:** Learning only if non-obvious.
10. **B11:** Mark `- [x] plan-task-12: ... — Session: completed cleanly`. Commit. Exit.

## Extra notes

- Operate in `hooks/`. Only touch hook payload builder + hook tests.
- Do NOT modify backend code.
- Use `uv run pytest` from within `hooks/`.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
