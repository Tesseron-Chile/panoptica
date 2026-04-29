# NEXT_PROMPT9 — Coder (Phase B, iteration 9)

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

Claim **`plan-task-9`** (PLAN.md watcher). plan-task-1..8 are ✅.

Implementation spec lives in section **"Task 9: PLAN.md watcher"** of:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

Read that section first. Polls `{workdocs_dir}/PLAN.md` for every active run; updates `Run.plan_tasks` via callback on content change.

## Process

1. **B2:** Read skill + workdocs; verify branch.
2. **B3:** Mark `plan-task-9` as `- [🔧]`; commit `chore(plan): claim plan-task-9`.
3. **B4:** `cd backend && uv run pytest --collect-only -q 2>&1 | tail -3`.
4. **B5:** TDD per plan doc:
   - Create `backend/tests/test_plan_watcher.py`.
   - Run, expect fail.
   - Create `backend/app/core/plan_watcher.py`.
   - Run, expect pass.
   - Commit per plan-doc message.
5. **B6:** Self-review.
6. **B7:** `cd backend && uv run pytest tests/test_plan_watcher.py -v` green.
7. **B8:** PLAN.md sanity.
8. **B9:** `cd backend && uv run pytest tests/ -q` — stay at 292+ passed.
9. **B10:** Learning only if non-obvious.
10. **B11:** Mark `- [x] plan-task-9: ... — Session: completed cleanly`. Commit. Exit.

## Extra notes

- Uses `parse_plan` from `app.core.plan_parser` and `PlanTask` from `app.models.runs`.
- Follow `beads_poller.py` pattern (asyncio, hash-based diff, first-failure WARNING then DEBUG).
- Takes a callback to publish updates; do NOT wire into app lifecycle here (plan-task-11).
- Do NOT edit files outside `backend/app/core/plan_watcher.py` and `backend/tests/test_plan_watcher.py`.
- Use `uv run pytest`. Commit frequently.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
