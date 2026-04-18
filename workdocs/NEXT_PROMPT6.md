# NEXT_PROMPT6 — Coder (Phase B, iteration 6)

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

Claim **`plan-task-6`** (Session tagger). plan-task-1..5 are ✅.

Implementation spec lives in section **"Task 6: Session tagger"** of:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

Read that section first. It classifies a session at `session_start` time across env-vs-marker permutations.

## Process

1. **B2:** Read skill + workdocs; verify branch.
2. **B3:** Mark `plan-task-6` as `- [🔧]`; commit `chore(plan): claim plan-task-6`.
3. **B4:** `cd backend && uv run pytest --collect-only -q 2>&1 | tail -3`.
4. **B5:** TDD per plan doc:
   - Create `backend/tests/test_session_tagger.py`.
   - Run, expect fail.
   - Create `backend/app/core/session_tagger.py`.
   - Run, expect pass.
   - Commit per plan-doc message.
5. **B6:** Self-review.
6. **B7:** `cd backend && uv run pytest tests/test_session_tagger.py -v` green.
7. **B8:** PLAN.md sanity.
8. **B9:** `cd backend && uv run pytest tests/ -q` — stay at 276+ passed.
9. **B10:** Learning only if non-obvious.
10. **B11:** Mark `- [x] plan-task-6: ... — Session: completed cleanly`. Commit. Exit.

## Extra notes

- Pure module, no I/O beyond reading the marker/env args passed in. Uses `MarkerFile` from `app.core.marker_file` and `Role` from `app.models.runs`.
- Do NOT edit files outside `backend/app/core/session_tagger.py` and `backend/tests/test_session_tagger.py`.
- Use `uv run pytest`. Commit frequently.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
