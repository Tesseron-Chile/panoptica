# PLAN — Chain 2 (review fixes)

Refinement run. Branch `feature/ralph-panoptica-spec-a`. PR #4.

Each task: **(1)** read the issue in `USER_PROMPT.md`, **(2)** write a failing
regression test, **(3)** implement, **(4)** green test, **(5)** commit, **(6)**
mark ✅. Primary repo: `panoptica` (this dir).

## Tasks

- [✅] fix-task-1: **StateMachine Ralph attribution** — `backend/app/core/state_machine.py` + `backend/app/core/handlers/session_handler.py`. Expose `run_id`, `role`, `task_id` on the runtime `Session` model that StateMachine owns (pref option a from USER_PROMPT). Remove the `getattr(sm, "session", None)` fallback. Add a test that drives a real StateMachine through a `session_start` event with RALPH_* fields in EventData and asserts the resulting session carries run_id/role/task_id.

- [✅] fix-task-2: **Aggregator receives all marker events** — `backend/app/core/event_processor.py::_handle_marker_event`. Call `RunAggregator.upsert_from_marker` on `run_start`, `run_phase_change`, and `run_end`. Regression test: three marker events → three aggregator calls, phase transitions reflected in run state.

- [✅] fix-task-3: **Plan watcher first-failure WARN→DEBUG** — `backend/app/core/plan_watcher.py`. Port the pattern from `backend/app/core/beads_poller.py`. Test with a missing PLAN.md path: first poll logs WARN, subsequent failures DEBUG, recovery logs INFO.

- [ ] fix-task-4: **Plan parser debug on malformed lines** — `backend/app/core/plan_parser.py::parse_plan_md`. Emit a DEBUG log per malformed line (rate-limited to first N per call to avoid flood). Test with a PLAN containing 3 malformed lines → 3 debug records.

- [ ] fix-task-5: **Path-traversal guard on working_dir** — `backend/app/core/marker_file.py::marker_path_for_cwd` (or caller in session_tagger / event_processor). Validate: must be absolute after `Path.resolve(strict=False)`; reject if `..` components remain; reject if outside a configured allowlist root (use `$HOME` as default root for now). Test with `/tmp/foo/../../etc/passwd` → rejection.

- [ ] fix-task-6: **Bound MarkerWatcher registrations** — `backend/app/core/marker_watcher.py`. Cap at 256 watched paths; LRU-evict the oldest on overflow with a WARN log. Test: register 257 paths, assert first is evicted and WARN fired.

- [ ] fix-task-7: **Unregister _WatchedPath on run_end** — `backend/app/core/event_processor.py` + `marker_watcher.py`. On `run_end` marker event, remove the path from the watcher. Test: run_start → run_end → path no longer tracked.

- [ ] fix-task-8: **Async-safe marker reads** — `backend/app/core/event_processor.py::_handle_marker_event`. Wrap the synchronous `read_marker` with `asyncio.to_thread`. Test: handler is called concurrently with 10 markers; event loop is not blocked longer than Nms (loosely: assert completion under a generous deadline).

- [ ] fix-task-9: **Log-on-swallow for silent-failure majors** — walk the 5 major silent-failure findings from PR #4 reviewer comments; add a DEBUG log per swallow site with file, exception type, and enough context to trace. Test: monkeypatch the dependency to raise; assert the DEBUG log is emitted.

- [ ] fix-task-10: **run_id channel-name validation** — `backend/app/core/broadcast_service.py::broadcast_run_state`. Validate `run_id` matches `^ral-[0-9]{8}-[0-9a-f]{4}$` before constructing `_run:<run_id>` channel. Reject (raise + log WARN) on mismatch. Test malicious run_id like `..:admin`.

- [ ] fix-task-11: **PLAN.md size cap** — `backend/app/core/plan_parser.py` or `plan_watcher.py`. Reject files > 1 MiB with a WARN; return empty task list. Test with a 2 MiB synthesized file.

- [ ] fix-task-12: **mtime+size quick-check for plan_watcher** — `backend/app/core/plan_watcher.py`. Skip hash computation when mtime and size are unchanged. Test: 3 polls against unchanged file → 1 hash call.

## Wrap-up

- [ ] fix-task-13: `cd backend && uv run pytest tests/ -q` — all green
- [ ] fix-task-14: `cd backend && make lint` and `cd hooks && make lint` — green
- [ ] fix-task-15: File GitHub issues for deferred Minors (label `ralph-wip`); list in TAKEAWAYS.md
- [ ] fix-task-16: Update PR #4 description with a "Chain 2 review fixes" section listing each fix-task and its commit SHA
