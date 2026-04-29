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

### T3 implementation notes

- `floor_connections` pattern mirrors `room_connections` exactly — same lock, same failed-connection cleanup, same early-return on empty list.
- `/ws/floor/{floor_id}` endpoint follows `/ws/room/{room_id}` exactly — accept, receive loop, disconnect in finally.
- Broadcast dicts use snake_case outer keys (`floor_id`) per SPEC, inner message/update objects use camelCase via `model_dump(by_alias=True)`.
- WebSocket tests use module-level `TestClient(app)` (same pattern as test_api.py) — avoids lifespan startup; `setup_test_database` session fixture ensures DB is ready.
- 5 WS tests cover: connect, chat broadcast, update broadcast, disconnect cleanup, cross-floor isolation.
- 395 total tests passing after T3 (5 new tests added).

### No authentication
Matches existing API pattern — all endpoints are open. Auth is a future concern for the full Prometeo system, not Run A-2.

### Cursor pagination for chat
Uses `before` (message ID) for cursor-based pagination instead of offset. More efficient for growing chat histories and avoids the skipped/duplicated row problem of offset pagination.

## Phase C Notes

- gitleaks not installed — secret scan skipped (C2). No secrets expected in this run (all backend data models, no credentials).

### C7 Verification Summary (Iteration 1)

**Programmatic Success Criteria:**

| SC | Description | Result |
|----|-------------|--------|
| SC-1 | Chat table and model exist | PASS |
| SC-2 | FloorUpdate table and model exist | PASS |
| SC-3 | Chat Pydantic models exist | PASS |
| SC-4 | FloorUpdate Pydantic models exist | PASS |
| SC-5 | Chat REST endpoints registered | PASS |
| SC-6 | FloorUpdate REST endpoints registered | PASS (uses `floor_router` + `updates_router` — two routers per design) |
| SC-7 | Floor WebSocket infrastructure exists | PASS |
| SC-8 | All tests pass (no regressions) | PASS — 395 passed, 1 pre-existing warning |
| SC-9 | Ruff passes | PASS |
| SC-10 | New test files exist and pass | PASS — 30 tests (10 chat + 15 updates + 5 WS) |

**Requirement Classification:**

| Requirement | Status |
|-------------|--------|
| Chat: SQLite table `chat_messages` | Fully met |
| Chat: POST endpoint to send message | Fully met |
| Chat: GET with cursor pagination | Fully met |
| Chat: WS broadcast of new messages | Fully met |
| Floor Updates: SQLite table `floor_updates` | Fully met |
| Floor Updates: POST endpoint | Fully met |
| Floor Updates: GET per-floor with priority filter + auto-expiry | Fully met |
| Floor Updates: GET cross-floor latest | Fully met |
| Floor Updates: PATCH resolve/unresolve | Fully met |
| Floor Updates: WS broadcast of new updates | Fully met |
| WebSocket: `/ws/floor/{floor_id}` endpoint | Fully met |
| WebSocket: `ConnectionManager` floor tracking | Fully met |
| WebSocket: broadcast to floor subscribers | Fully met |
| Non-functional: no regressions (395/395 pass) | Fully met |
| Non-functional: ruff clean | Fully met |
| Security: Pydantic validation (Literal types) | Partially met — `FloorUpdateCreate.priority` uses Literal, but `FloorUpdateResponse.priority` is plain `str`; no `max_length` on string fields |
| Security: SQLAlchemy ORM (no raw SQL) | Fully met |

**Reviewer Findings (C6, Iteration 1) — Disposition:**

| # | Severity | Finding | Disposition |
|---|----------|---------|-------------|
| 1 | Minor | `get_latest_updates` loads all rows — add SQL LIMIT/WHERE guard | Acknowledged → coder C8 |
| 2 | Minor | No `max_length` on `ChatMessageCreate.content/sender`, `FloorUpdateCreate.title/body` | Acknowledged → coder C8 |
| 3 | Nit | `FloorUpdateResponse.priority` is `str`, should be `Literal[...]` | Acknowledged → coder C8 |
| 4 | Nit | Redundant `except (WebSocketDisconnect, Exception)` | Acknowledged → coder C8 |
| 5 | Nit | Unused `logger` in `chat.py` and `floor_updates.py` | Acknowledged → coder C8 |

**AI Reviewer Comments:** No AI reviewers configured (`ai_reviewer_triggers = []`). No external AI review comments found on PR.

**PR Comment Replies:** Reviewer findings were posted as a review summary (not individual comments). Acknowledgment comment posted on PR #8 (all findings passed to coder for C8).
