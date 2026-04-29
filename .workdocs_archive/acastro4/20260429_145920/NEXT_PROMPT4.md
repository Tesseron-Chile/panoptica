# NEXT_PROMPT4 — Coder (Phase B, iteration 4)

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

Claim **`plan-task-4`** (Marker file reader — pure). plan-task-1/2/3 are ✅.

Implementation spec lives in section **"Task 4: Marker file reader (pure)"** of:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

Read that section first.

## Process

1. **B2:** Read skill + workdocs; verify branch.
2. **B3:** Mark `plan-task-4` as `- [🔧]` in `workdocs/PLAN.md`; commit `chore(plan): claim plan-task-4`.
3. **B4:** `cd backend && uv run pytest --collect-only -q 2>&1 | tail -3`.
4. **B5:** TDD per plan doc:
   - Create `backend/tests/test_marker_file.py` with failing tests.
   - Run them, expect fail.
   - Create `backend/app/core/marker_file.py` with implementation.
   - Run tests, expect pass.
   - Commit per plan-doc message.
5. **B6:** Self-review diff.
6. **B7:** `cd backend && uv run pytest tests/test_marker_file.py -v` green.
7. **B8:** PLAN.md sanity.
8. **B9:** `cd backend && uv run pytest tests/ -q` — must stay at 267+ passed.
9. **B10:** Add a learning only if non-obvious.
10. **B11:** Mark `- [x] plan-task-4: ... — Session: completed cleanly`. Commit. Exit.

## Extra notes

- Module is **pure** — no I/O side effects beyond reading the marker file, no globals, no watchers. The watcher comes in plan-task-8.
- Use `uv run pytest`. Commit frequently.
- Do NOT edit files outside `backend/app/core/marker_file.py` and `backend/tests/test_marker_file.py`.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
