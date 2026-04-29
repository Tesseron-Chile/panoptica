# NEXT_PROMPT5 — Coder (Phase B, iteration 5)

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

Claim **`plan-task-5`** (PLAN.md parser — pure, lax). plan-task-1/2/3/4 are ✅.

Implementation spec lives in section **"Task 5: PLAN.md parser (pure, lax)"** of:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

Read that section first.

## Process

1. **B2:** Read skill + workdocs; verify branch.
2. **B3:** Mark `plan-task-5` as `- [🔧]` in `workdocs/PLAN.md`; commit `chore(plan): claim plan-task-5`.
3. **B4:** `cd backend && uv run pytest --collect-only -q 2>&1 | tail -3`.
4. **B5:** TDD per plan doc:
   - Create `backend/tests/test_plan_parser.py` with failing tests.
   - Run them, expect fail.
   - Create `backend/app/core/plan_parser.py` with implementation.
   - Run tests, expect pass.
   - Commit per plan-doc message.
5. **B6:** Self-review diff.
6. **B7:** `cd backend && uv run pytest tests/test_plan_parser.py -v` green.
7. **B8:** PLAN.md sanity.
8. **B9:** `cd backend && uv run pytest tests/ -q` — must stay at 272+ passed.
9. **B10:** Add a learning only if non-obvious.
10. **B11:** Mark `- [x] plan-task-5: ... — Session: completed cleanly`. Commit. Exit.

## Extra notes

- Parser is **pure, lax** — tolerant of minor format variations. Return what's parseable; do not raise on odd lines.
- Recognize status markers: `- [ ]` ⬜, `- [🔧]` in-progress, `- [x]` ✅.
- Reuse `PlanTask` / `PlanTaskStatus` from `backend/app/models/runs.py`.
- Use `uv run pytest`. Commit frequently.
- Do NOT edit files outside `backend/app/core/plan_parser.py` and `backend/tests/test_plan_parser.py`.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
