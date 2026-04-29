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
- 365 backend tests passing at branch point (includes Run A-1 additions)

## Untracked " 2" Duplicate Files

~50 files with " 2" suffix (e.g. `agent_runner 2.py`) are untracked Finder duplicates from macOS. They are NOT part of the codebase and should NOT be committed. Safe to ignore.

## Known Pre-existing Issues

- pyright exits non-zero with 551 errors in `event_processor.py` and `test_simulation_pipeline.py` — pre-existing, not introduced by any run. `make checkall` is considered passing if ruff + pytest pass even when pyright fails.

## Phase A Design Decisions (Designer)

### API path structure
Chose nested paths (`/floors/{floor_id}/chat`, `/floors/{floor_id}/updates`) over flat query params. Matches the design doc and is more RESTful for floor-scoped resources. Cross-floor endpoint (`/updates/latest`) uses a separate router prefix.

### Auto-expiry at query time
Floor updates use query-time expiry filtering instead of background deletion. Simpler, no background task needed, and expired data remains queryable via `include_expired=true`. Critical updates bypass expiry entirely.

### Floor-level WebSocket
Added a new connection tier (`floor_connections`) to the existing `ConnectionManager`, following the exact pattern of `room_connections`. This gives the frontend a clean subscription model per floor without overloading the existing session/room channels.

### Two routers in floor_updates.py
The floor updates file exports two routers: one with prefix `/floors` (for per-floor CRUD) and one with prefix `/updates` (for cross-floor latest and patch-by-id). Both registered separately in `main.py`.

### T2 implementation notes

- `FloorUpdateCreate` uses snake_case fields (no alias_generator) — request bodies must use `auto_expire_hours`, not `autoExpireHours`. Only `FloorUpdateResponse` has camelCase aliasing.
- Auto-expiry uses Python-side filtering after loading records (not SQL-level). SQLite's per-row `auto_expire_hours` can't easily be used in a portable SQL WHERE clause. Dataset is small so this is fine.
- `_is_expired` guards against tz-naive timestamps from SQLite by normalizing to UTC before comparison.
- Two routers (`floor_router` + `updates_router`) in one file, both registered separately in `main.py` — FastAPI handles multiple routers with the same prefix without conflict.
- `/updates/latest` sorts in Python: `(PRIORITY_ORDER.get(r.priority, 99), -r.id)` to sort by priority rank then newest first.
- `db.get(FloorUpdateRecord, update_id)` returns `None` cleanly for missing IDs in PATCH — raises 404.
- 390 total tests passing after T2 (15 new tests added).

### T1 implementation notes

- `pytest_asyncio.fixture` needed explicitly for async fixtures even in `asyncio_mode="auto"`; regular `@pytest.fixture` doesn't work for async generators
- The SQLAlchemy warning (`coroutine 'AsyncMockMixin._execute_mock_call' was never awaited`) is pre-existing from other test mocks, not from T1 code
- `ChatMessageResponse.model_validate(record)` with `from_attributes=True` works cleanly for ORM→Pydantic conversion
- No `Index` import needed — `mapped_column(..., index=True)` handles floor_id indexing inline

### No authentication
Matches existing API pattern — all endpoints are open. Auth is a future concern for the full Prometeo system, not Run A-2.

### Cursor pagination for chat
Uses `before` (message ID) for cursor-based pagination instead of offset. More efficient for growing chat histories and avoids the skipped/duplicated row problem of offset pagination.
