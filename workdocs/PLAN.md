# PLAN

Spec A — Run visualizer, backend only. Full step-by-step plan lives at
`docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md`. Each task below
corresponds 1:1 to a task in that plan — open the plan for file paths, test
code, and exact commands.

Primary repo: `panoptica`. Branch: `feature/ralph-panoptica-spec-a`.

## Phase A (Design) — already done in this branch.

## Phase B (Implementation tasks)

- [x] plan-task-1: Run domain types — `backend/app/models/runs.py` — Session: completed cleanly
- [x] plan-task-2: Extend Session with run_id/role/task_id — Session: completed cleanly
- [x] plan-task-3: Synthetic event types + EventData extensions — Session: completed cleanly
- [x] plan-task-4: Marker file reader (pure) — `backend/app/core/marker_file.py` — Session: completed cleanly
- [x] plan-task-5: PLAN.md parser (pure, lax) — `backend/app/core/plan_parser.py` — Session: completed cleanly
- [x] plan-task-6: Session tagger — `backend/app/core/session_tagger.py` — Session: completed cleanly
- [x] plan-task-7: Run aggregator — `backend/app/core/run_aggregator.py` — Session: completed cleanly
- [x] plan-task-8: Marker-file watcher — `backend/app/core/marker_watcher.py` — Session: completed cleanly
- [🔧] plan-task-9: PLAN.md watcher — `backend/app/core/plan_watcher.py`
- [ ] plan-task-10: Wire tagger + aggregator into session_start / session_end
- [ ] plan-task-11: Wire marker + plan watchers into app lifecycle
- [ ] plan-task-12: Hooks forward RALPH_* env on session_start
- [ ] plan-task-13: Integration smoke test

## Phase C (Verify)

- [ ] plan-task-14: `cd backend && uv run pytest tests/ -v` green
- [ ] plan-task-15: `make checkall` from repo root green
- [ ] plan-task-16: Confirm no regression in existing Panoptica single-session flow

## Phase D (Review)

- [ ] plan-task-17: Self-review diff for placeholders, stale comments, unused imports
- [ ] plan-task-18: Summarize deltas in `workdocs/TAKEAWAYS.md`
