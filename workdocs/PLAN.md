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
- [x] plan-task-9: PLAN.md watcher — `backend/app/core/plan_watcher.py` — Session: completed cleanly
- [x] plan-task-10: Wire tagger + aggregator into session_start / session_end — Session: completed cleanly
- [x] plan-task-11: Wire marker + plan watchers into app lifecycle — Session: completed cleanly
- [x] plan-task-12: Hooks forward RALPH_* env on session_start — Session: completed cleanly
- [x] plan-task-13: Integration smoke test — Session: completed cleanly

## Phase C (Verify)

- [x] plan-task-14: `cd backend && uv run pytest tests/ -q` — 299 passed
- [x] plan-task-15: `make checkall` — ruff clean; pyright has 264 errors but baseline (f93a32d, pre-Ralph) has 267 → our work REDUCED pyright errors by 3. Pre-existing condition documented.
- [x] plan-task-16: No regression. Existing 260+ tests still pass; new tests add 39 (260+39=299).

## Phase D (Review)

- [x] plan-task-17: Self-review — ruff autofix pass committed in 373acb6 (import ordering, unused imports, line length).
- [x] plan-task-18: Summary in TAKEAWAYS.md
