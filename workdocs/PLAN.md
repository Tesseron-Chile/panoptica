# PLAN.md — Run A-2: Chat API + Floor Updates Backend

## Task Overview

| Task | Description | Deps | Status |
|------|-------------|------|--------|
| T1 | Chat system — DB model, Pydantic models, REST endpoints, tests | — | ⬜ |
| T2 | Floor updates — DB model, Pydantic models, REST endpoints, tests | — | ⬜ |
| T3 | Floor-level WebSocket infrastructure + broadcast integration + tests | T1, T2 | ⬜ |

---

## T1: Chat system — DB model, Pydantic models, REST endpoints, tests ⬜

**Description:** Build the complete chat message backend: SQLAlchemy model, Pydantic request/response models, REST endpoints (POST + GET with cursor pagination), register the router, and write tests.

**Files to create/modify:**

| File | Action |
|------|--------|
| `backend/app/db/models.py` | Add `ChatMessageRecord` class |
| `backend/app/models/chat.py` | New: `ChatMessageCreate`, `ChatMessageResponse` |
| `backend/app/api/routes/chat.py` | New: POST + GET endpoints with `APIRouter(prefix="/floors", tags=["chat"])` |
| `backend/app/main.py` | Import and register `chat.router` |
| `backend/tests/test_chat.py` | New: CRUD tests, floor filtering, pagination |

**Implementation notes:**
- Follow the `SessionRecord` pattern in `db/models.py` for the SQLAlchemy model (timezone-aware datetimes, mapped_column)
- Follow the `sessions.py` route pattern for endpoint structure (Annotated[AsyncSession, Depends(get_db)])
- Use `ConfigDict(alias_generator=to_camel, populate_by_name=True)` for response models
- Router prefix is `/floors` — endpoints are `/{floor_id}/chat`. Register in `main.py` with `prefix=settings.API_V1_STR`
- GET pagination: `before` param (message ID) for cursor-based, `limit` param with default 50
- For tests: use `httpx.AsyncClient` with `ASGITransport(app=app)` for API tests, plus direct DB tests via `db_session` fixture

**Success criteria:**
1. `ChatMessageRecord` exists in `db/models.py` with fields: `id`, `floor_id` (indexed), `sender`, `role`, `content`, `timestamp`
2. POST `/api/v1/floors/{floor_id}/chat` with `{"sender": "x", "role": "user", "content": "y"}` returns 200 with created message including `id` and `timestamp`
3. GET `/api/v1/floors/{floor_id}/chat` returns messages for that floor only, ordered newest first
4. GET with `?limit=5` returns at most 5 messages
5. GET with `?before=10` returns only messages with `id < 10`
6. All new tests pass: `cd backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/test_chat.py -v`
7. No regressions: `cd backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/ -v`
8. Ruff passes: `cd backend && /Users/albertocastrobravo/.local/bin/uv run ruff check . --exclude '*2.py'`

---

## T2: Floor updates — DB model, Pydantic models, REST endpoints, tests ⬜

**Description:** Build the floor updates backend: SQLAlchemy model, Pydantic models, REST endpoints (POST, GET per-floor with filters, GET cross-floor latest, PATCH for resolution), register the router, and write tests.

**Files to create/modify:**

| File | Action |
|------|--------|
| `backend/app/db/models.py` | Add `FloorUpdateRecord` class |
| `backend/app/models/floor_updates.py` | New: `FloorUpdateCreate`, `FloorUpdateResponse`, `PRIORITY_ORDER` |
| `backend/app/api/routes/floor_updates.py` | New: POST, GET (per-floor), GET (latest), PATCH. Two routers: one with prefix `/floors`, one with prefix `/updates` |
| `backend/app/main.py` | Import and register both routers |
| `backend/tests/test_floor_updates.py` | New: CRUD tests, priority filter, expiry, resolve |

**Implementation notes:**
- `FloorUpdateRecord` has `resolved: Mapped[bool]` with `default=False` and `auto_expire_hours: Mapped[int]` with `default=24`
- Auto-expiry logic: in GET queries, exclude rows where `now() > timestamp + timedelta(hours=auto_expire_hours)` UNLESS `priority == "critical"` or `include_expired=true`
- `/updates/latest` sorts by priority rank (`PRIORITY_ORDER` dict) then recency — use Python sorting since dataset is small
- PATCH `/updates/{update_id}` accepts `{"resolved": bool}` — returns updated record or 404
- Two routers in one file: `floor_router` (prefix `/floors`) for per-floor endpoints, `updates_router` (prefix `/updates`) for cross-floor and patch endpoints

**Success criteria:**
1. `FloorUpdateRecord` exists in `db/models.py` with fields: `id`, `floor_id` (indexed), `priority`, `title`, `body`, `timestamp`, `auto_expire_hours`, `resolved`
2. POST `/api/v1/floors/{floor_id}/updates` creates update, returns 200 with all fields
3. GET `/api/v1/floors/{floor_id}/updates` returns non-expired updates for that floor
4. GET with `?priority=critical` filters by priority
5. GET with `?include_expired=true` includes expired updates
6. GET `/api/v1/updates/latest?limit=3` returns top 3 cross-floor updates sorted by priority then recency
7. PATCH `/api/v1/updates/{id}` with `{"resolved": true}` marks update as resolved
8. Critical updates are NOT filtered out by expiry logic regardless of age
9. All new tests pass: `cd backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/test_floor_updates.py -v`
10. No regressions: `cd backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/ -v`
11. Ruff passes: `cd backend && /Users/albertocastrobravo/.local/bin/uv run ruff check . --exclude '*2.py'`

---

## T3: Floor-level WebSocket infrastructure + broadcast integration + tests ⬜

**Description:** Extend the existing `ConnectionManager` with floor-level connection tracking, add a `/ws/floor/{floor_id}` WebSocket endpoint, and integrate broadcast calls into the chat and floor update POST endpoints.

**Files to create/modify:**

| File | Action |
|------|--------|
| `backend/app/api/websocket.py` | Add `floor_connections` dict, `connect_floor`, `disconnect_floor`, `broadcast_floor` methods |
| `backend/app/main.py` | Add `@app.websocket("/ws/floor/{floor_id}")` endpoint |
| `backend/app/api/routes/chat.py` | Import `manager`, call `manager.broadcast_floor(...)` after creating message |
| `backend/app/api/routes/floor_updates.py` | Import `manager`, call `manager.broadcast_floor(...)` after creating update |
| `backend/tests/test_floor_websocket.py` | New: WS connection test, chat broadcast test, update broadcast test |

**Implementation notes:**
- Mirror the existing `room_connections` / `connect_room` / `disconnect_room` / `broadcast_room` pattern exactly — just s/room/floor/
- The `/ws/floor/{floor_id}` endpoint follows the `/ws/room/{room_id}` pattern: accept, register, keep-alive receive loop, disconnect on close
- Broadcast in chat POST: `await manager.broadcast_floor({"type": "chat_message", "floor_id": floor_id, "message": response.model_dump(mode="json", by_alias=True)}, floor_id)`
- Broadcast in update POST: `await manager.broadcast_floor({"type": "floor_update", "floor_id": floor_id, "update": response.model_dump(mode="json", by_alias=True)}, floor_id)`
- Use `BackgroundTasks` for broadcast if needed, but inline `await` is fine since `broadcast_floor` is non-blocking for empty subscriber lists
- For WS tests: use `starlette.testclient.TestClient` with `with client.websocket_connect("/ws/floor/test_floor") as ws:` pattern

**Success criteria:**
1. `ConnectionManager` has `floor_connections: dict[str, list[WebSocket]]` attribute
2. `connect_floor`, `disconnect_floor`, `broadcast_floor` methods exist and follow the `room_*` pattern
3. `/ws/floor/{floor_id}` endpoint accepts WebSocket connections
4. POST to `/api/v1/floors/{floor_id}/chat` triggers a `broadcast_floor` with `{"type": "chat_message", ...}`
5. POST to `/api/v1/floors/{floor_id}/updates` triggers a `broadcast_floor` with `{"type": "floor_update", ...}`
6. Failed floor connections are cleaned up (matching existing room/session cleanup logic)
7. All new tests pass: `cd backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/test_floor_websocket.py -v`
8. All tests pass (no regressions): `cd backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/ -v`
9. Ruff passes: `cd backend && /Users/albertocastrobravo/.local/bin/uv run ruff check . --exclude '*2.py'`
