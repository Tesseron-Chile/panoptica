# Takeaways

## Phase A Design Decisions

- Run A-1 implements backend infrastructure only — no frontend, no WebSocket changes
- CLAUDE_OFFICE_FLOOR_ID is the key routing mechanism: AgentRunner injects it into env, existing hooks propagate it, backend routes events to correct floor
- APScheduler 3.x with AsyncIOScheduler chosen (runs on existing FastAPI event loop, no extra threads)
- fire-and-forget subprocess model: AgentRunner does not await agent completion (hooks handle the feedback loop)
- FloorScheduler skips floors with is_c_level=True (C-Level has no autonomous scheduled tasks)
- EventData.floor_id already exists in backend/app/models/events.py — no model change needed for hooks integration
- floors.toml replaces Tesseron products with Prometeo departments — breaking change to building config, but no running services depend on specific floor IDs

## Known Issues

- Local main is 1 commit ahead of origin/main (spec doc commit from brainstorming). Need to push main before creating PR in Phase C.
- Plan is at docs/superpowers/plans/ not workdocs/ — coder agents should use workdocs/PLAN.md

## Task 1 Notes (Run A-1)

- `uv` was not on the Bash tool's PATH; installed via `curl -LsSf https://astral.sh/uv/install.sh | sh` to `~/.local/bin/uv`. Use full path `/Users/albertocastrobravo/.local/bin/uv` in subsequent coder sessions, or source the shell profile first.
- `apscheduler==3.11.2` was resolved (satisfies `>=3.10.4`). Import verified.

## Task 3 Notes (Run A-1)

- Existing `test_floor_config.py` tests use inline SAMPLE_TOML strings — no test updates needed after floors.toml replacement.
- Full backend suite (335 tests) passes with no regressions.
- Config verified to load all 6 Prometeo departments with correct floor numbers, IDs, icons, and schedule task counts.
- `uv` Bash commands require running from `backend/` subdirectory; git commands require project root — always use full absolute paths in cd.

## Task 5 Notes (Run A-1)

- `asyncio.create_subprocess_exec` called with positional args `("claude", "-p", prompt)` and keyword args `env=env, cwd=cwd` — mock assertions use `call_args.kwargs` to verify env injection.
- Fire-and-forget: subprocess not awaited; 339 backend tests pass with no regressions.

## Task 7 Notes (Run A-1)

- `get_building_config()` uses `@lru_cache` so the singleton is created once at startup — no repeated TOML file reads.
- FloorScheduler logs "FloorScheduler started with 22 jobs" (5 floors × daily+weekly, c_level skipped).
- Pre-existing pyright errors in `scheduler.py` (missing apscheduler type stubs) and `event_processor.py` are not introduced by Task 7 — they existed from Tasks 5/6 and the pre-existing codebase. ruff format/lint and all 344 tests pass cleanly.
- ruff format reformatted several test files during checkall — committed as lint cleanup.

## Workflow Notes

- Design was done in a prior brainstorming session and approved by user — designer agent adapted existing docs rather than discovering from scratch
- Designer agent incorrectly copied stale NEXT_PROMPT2-12.md files from a prior Ralph run found in .superpowers/ directory. Orchestrator cleaned them up. Note for future: give designer agent explicit instruction to NOT search .superpowers/ for existing prompt files.
