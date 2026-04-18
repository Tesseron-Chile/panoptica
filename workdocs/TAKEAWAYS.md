# Takeaways

Ongoing log of learnings, deviations, broken assumptions, and workflow observations.

## Run setup notes

- **Phase A done out-of-band.** SPEC and PLAN were authored in a prior brainstorming + writing-plans session and committed before Ralph was invoked. Designer agent was not spawned.
- **Branch naming deviation.** Feature branch is `feature/ralph-panoptica-spec-a`, not the standard `ralph/<uuid>`. User's explicit choice — kept because it already holds the approved SPEC commit.
- **Plan doc location.** The full detailed plan (with code + tests per task) lives at `docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md`. `workdocs/PLAN.md` is a slim task-list pointing to it. Coders must read the matching task section in the plan doc before starting.
- **Task 12 touches `hooks/`.** Not `backend/`. Coder for that task must operate in `hooks/`.

## Learnings

- **`plan_parser.py` uses `~` for IN_PROGRESS, not `🔧`:** The plan doc's spec (and test samples) use `[~]` as the in-progress marker. The actual `workdocs/PLAN.md` uses `[🔧]`. The regex captures a single char and `🔧` (single Unicode code point) would be matched but falls through to the default `PlanTaskStatus.TODO` because `🔧` is not in `_STATUS_MAP`. Downstream consumers (Task 9 plan_watcher) should be aware — or a follow-up task can add `🔧` to `_STATUS_MAP`. Filed as a note; no change made per task scope.

- **`model_config` collision in Pydantic v2:** `Run.model_config` is a reserved Pydantic class attribute for `ConfigDict`. The field holding Ralph's per-role model strings must be named `model_config_` with `Field(alias="modelConfig")`. Tests must use the Python name `model_config_=...` as the kwarg. JSON round-trips as `modelConfig` correctly. Plan doc called this out and the approach works.
- **`git add` from a subdirectory:** Running `uv run pytest` from `backend/` sets the shell CWD there. Subsequent bare `git add` calls must be run from repo root (or use `git -C <repo_root>`), otherwise git misinterprets relative paths.
- **Pyright false positive on `list[PlanTask]`:** With `from __future__ import annotations`, Pyright reports `plan_tasks` as `list[Unknown]`. This is a static-analysis artifact — runtime and tests are correct. Not worth working around; no functional impact.
- **Task 11 — `broadcast_run_state` uses synthetic channel `_run:<run_id>`:** Runs span multiple sessions so there's no single session_id to broadcast to. The channel `f"_run:{run_id}"` is a synthetic WebSocket subscription key; frontend (Plan 2) will subscribe to it.
- **Task 11 — `PlanWatcher` needed module-level singleton:** `init_plan_watcher` / `get_plan_watcher` were added to `plan_watcher.py` to match `marker_watcher.py`'s pattern.
- **Task 11 — `_handle_marker_event` re-reads marker from disk:** `RunAggregator.upsert_from_marker` takes a `MarkerFile` (not a raw dict). On `run_start`, we re-read via `read_marker(marker_path_for_cwd(Path(primary_repo)))` rather than reconstructing from the watcher payload.

## Phase C/D summary (2026-04-18)

- **Phase B complete, 13/13 tasks ✅.** 299 backend tests + 16 hooks tests green.
- **Ruff clean** after autofix pass (commit `373acb6`): import ordering, unused imports, two line-length touch-ups in `session_tagger.py` and `runs.py`.
- **Pyright pre-existing failure:** baseline commit `f93a32d` (pre-Ralph) has 267 pyright errors. Current branch has 264 — our work actually reduced errors by 3 (the `model_config_` Pydantic alias kwarg is reported as "No parameter named" but is valid due to `populate_by_name=True`). `make checkall` still fails on pyright; this is not a regression and belongs in a separate cleanup effort. Backend `make test` and `make lint` pass.
- **No regression in Panoptica single-session flow:** pre-existing tests still pass unchanged. All 39 new tests (runs, marker, plan_parser, plan_watcher, marker_watcher, session_tagger, run_aggregator, events_run, session_handler_ralph, ralph_pipeline_smoke) are additive.
- **Coder session metric:** 13 fresh Sonnet-4.6 sessions, one per task. Each consistently followed TDD (claim → failing test → implementation → passing test → mark done). No stuck loops, no rollbacks needed.
