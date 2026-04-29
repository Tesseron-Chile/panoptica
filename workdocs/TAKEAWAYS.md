# Takeaways — Run A-2

## Scope Decision (Orchestrator)

Run A-2 is **backend only** — same pattern as Run A-1.

| Run | Scope |
|-----|-------|
| A-2 (this run) | `chat_messages` table + REST endpoints + WebSocket broadcast; `FloorUpdate` model + `floor_updates` table + endpoints; Tests |
| A-3 (next run) | Whiteboard mode 12 (Updates Board); Updates bar in BuildingView; Tab Chat in RightSidebar; CLevelView básico |

Reason: Keeps runs cleanly verifiable. Frontend changes require browser testing and mix poorly with backend-focused TDD sessions.

## Chained from Run A-1

- `uv` not on default PATH — use full path `/Users/albertocastrobravo/.local/bin/uv`
- Run from `backend/` for uv commands; from project root for git commands
- Feature branch: `ralph/ebcdeee9` off `prometeo`
- Target branch: `prometeo`
- 345 backend tests + 18 hook tests passing at branch point

## Untracked " 2" Duplicate Files

~50 files with " 2" suffix (e.g. `agent_runner 2.py`) are untracked Finder duplicates from macOS. They are NOT part of the codebase and should NOT be committed. Safe to ignore.

## Known Pre-existing Issues

- pyright exits non-zero with 551 errors in `event_processor.py` and `test_simulation_pipeline.py` — pre-existing, not introduced by any run. `make checkall` is considered passing if ruff + pytest pass even when pyright fails.
