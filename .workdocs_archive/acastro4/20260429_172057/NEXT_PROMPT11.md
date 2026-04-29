# NEXT_PROMPT11 — Coder (Phase B, iteration 11)

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

Claim **`plan-task-11`** (Wire marker + plan watchers into app lifecycle). plan-task-1..10 are ✅.

Implementation spec lives in section **"Task 11: Wire marker-watcher + plan-watcher into app lifecycle"** of:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

Read that section first. Integration task — wiring into FastAPI lifespan/EventProcessor alongside beads_poller.

## Process

1. **B2:** Read skill + workdocs; verify branch.
2. **B3:** Mark `plan-task-11` as `- [🔧]`; commit `chore(plan): claim plan-task-11`.
3. **B4:** `cd backend && uv run pytest --collect-only -q 2>&1 | tail -3`.
4. **B5:** Follow plan-doc steps:
   - `grep -rn "init_beads_poller\|start_polling" backend/app --include='*.py'` to locate lifecycle wiring.
   - Add `MarkerWatcher` + `PlanWatcher` alongside, with callbacks that feed synthesized Events through the existing event bus (reuse `process_event`).
   - Add tests where feasible. Commit per plan-doc message.
5. **B6:** Self-review.
6. **B7:** Relevant tests green.
7. **B8:** PLAN.md sanity.
8. **B9:** `cd backend && uv run pytest tests/ -q` — stay at 298+ passed.
9. **B10:** Learning only if non-obvious.
10. **B11:** Mark `- [x] plan-task-11: ... — Session: completed cleanly`. Commit. Exit.

## Extra notes

- Reuse the existing `RunAggregator` singleton already wired in `event_processor.py` (plan-task-10). Do NOT instantiate a second one.
- Marker callback synthesizes an Event and calls the normal `process_event` path — do NOT invent a parallel broadcast.
- Plan watcher callback should update aggregator's `Run.plan_tasks` via the aggregator API.
- Touch only lifecycle wiring files + possibly a new integration test file. Do not modify watchers, aggregator, handlers.
- Use `uv run pytest`. Commit frequently.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
