# NEXT_PROMPT7 — Coder (Phase B, iteration 7)

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

Claim **`plan-task-7`** (Run aggregator). plan-task-1..6 are ✅.

Implementation spec lives in section **"Task 7: Run aggregator"** of:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

Read that section first. Holds Run objects in memory; membership, phase, end. No I/O; driven by explicit calls.

## Process

1. **B2:** Read skill + workdocs; verify branch.
2. **B3:** Mark `plan-task-7` as `- [🔧]`; commit `chore(plan): claim plan-task-7`.
3. **B4:** `cd backend && uv run pytest --collect-only -q 2>&1 | tail -3`.
4. **B5:** TDD per plan doc:
   - Create `backend/tests/test_run_aggregator.py`.
   - Run, expect fail.
   - Create `backend/app/core/run_aggregator.py`.
   - Run, expect pass.
   - Commit per plan-doc message.
5. **B6:** Self-review.
6. **B7:** `cd backend && uv run pytest tests/test_run_aggregator.py -v` green.
7. **B8:** PLAN.md sanity.
8. **B9:** `cd backend && uv run pytest tests/ -q` — stay at 282+ passed.
9. **B10:** Learning only if non-obvious.
10. **B11:** Mark `- [x] plan-task-7: ... — Session: completed cleanly`. Commit. Exit.

## Extra notes

- Uses `Run`, `RunPhase`, `RunOutcome`, `Role` from `app.models.runs` and `MarkerFile` from `app.core.marker_file`.
- Pure in-memory class, no watchers. Watchers come later (plan-task-8/9).
- Do NOT edit files outside `backend/app/core/run_aggregator.py` and `backend/tests/test_run_aggregator.py`.
- Use `uv run pytest`. Commit frequently.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
