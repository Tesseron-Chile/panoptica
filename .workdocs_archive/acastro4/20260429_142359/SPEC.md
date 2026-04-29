# SPEC.md — Run A-2: Chat API + Floor Updates Backend

## Problem Description

Prometeo Company OS needs per-floor communication channels and a cross-floor updates board. Run A-1 established the floor/department infrastructure (floors.toml, scheduler, agent runner). Run A-2 adds the backend for:

1. **Chat API** — per-floor chat channels for human-agent communication
2. **Floor Updates** — priority-based status updates posted by agents, visible cross-floor

Frontend consumption of these APIs is deferred to Run A-3.

## Requirements

### Functional

**Chat System:**
- SQLite table `chat_messages` storing messages per floor
- POST endpoint to send a message to a floor's chat
- GET endpoint to retrieve chat history per floor with cursor pagination
- WebSocket broadcast of new messages to floor subscribers

**Floor Updates System:**
- SQLite table `floor_updates` storing priority-based updates
- POST endpoint to create a floor update
- GET endpoint to retrieve updates per floor with priority filter and auto-expiry
- GET endpoint to retrieve latest updates cross-floor (for future updates bar)
- PATCH endpoint to resolve/unresolve critical updates
- WebSocket broadcast of new updates to floor subscribers

**WebSocket Infrastructure:**
- Floor-level WebSocket endpoint `/ws/floor/{floor_id}`
- Extend existing `ConnectionManager` with floor connection tracking
- Broadcast chat messages and floor updates to floor subscribers

### Non-Functional
- No regressions in existing 365 backend tests
- All new code passes ruff linting
- Response times consistent with existing endpoints

### Security
- Input validation via Pydantic models (Literal types for enums, length limits)
- All queries through SQLAlchemy ORM (no raw SQL injection risk)
- No authentication — matches existing open API pattern

## Assumptions

- SQLite is sufficient for chat and updates storage (same as existing tables)
- No authentication/authorization required (matches existing API pattern)
- `floor_id` values are not validated against `floors.toml` at the API level — any string accepted
- Auto-expiry enforced at query time (filter out expired), not via background deletion
- Critical updates never auto-expire — require explicit resolution via PATCH

## Existing Architecture

### Database (`backend/app/db/`)
- **Engine:** SQLAlchemy async + aiosqlite
- **Models:** `Base(DeclarativeBase)` in `db/models.py`; existing tables: `sessions`, `events`, `tasks`, `user_preferences`
- **Sessions:** `async_sessionmaker` with `get_db()` FastAPI dependency
- **New tables:** Created automatically by `Base.metadata.create_all()` at startup — no migration needed

### API Routes (`backend/app/api/routes/`)
- Pattern: `router = APIRouter(prefix=..., tags=[...])` per file
- Registration: `app.include_router(router, prefix=settings.API_V1_STR)` in `main.py`
- DB access: `Annotated[AsyncSession, Depends(get_db)]`

### WebSocket (`backend/app/api/websocket.py`)
- `ConnectionManager` singleton (`manager`) with session-level and room-level connections
- Endpoints: `/ws/{session_id}` (per-session), `/ws/room/{room_id}` (per-room)
- `broadcast_all()` for cross-session broadcast

### Pydantic Models (`backend/app/models/`)
- Pattern: `ConfigDict(alias_generator=to_camel, populate_by_name=True)` for camelCase JSON

## Proposed Architecture

### New SQLite Tables

**`chat_messages`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER | PK, autoincrement |
| `floor_id` | TEXT | Indexed |
| `sender` | TEXT | Display name of sender |
| `role` | TEXT | `"user"` / `"agent"` / `"system"` |
| `content` | TEXT | Message body |
| `timestamp` | DATETIME(tz) | Default: `now(UTC)` |

**`floor_updates`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER | PK, autoincrement |
| `floor_id` | TEXT | Indexed |
| `priority` | TEXT | `"critical"` / `"alert"` / `"info"` / `"report"` |
| `title` | TEXT | Short title |
| `body` | TEXT | Full description |
| `timestamp` | DATETIME(tz) | Default: `now(UTC)` |
| `auto_expire_hours` | INTEGER | Default: 24 |
| `resolved` | BOOLEAN | Default: false |

### New API Endpoints

**Chat** (`backend/app/api/routes/chat.py`, prefix `/floors`, tags `["chat"]`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/floors/{floor_id}/chat` | Send message. Body: `ChatMessageCreate`. Returns `ChatMessageResponse`. Broadcasts via floor WS. |
| GET | `/floors/{floor_id}/chat` | Chat history. Query: `limit` (int, default 50), `before` (int, message ID for cursor). Returns `list[ChatMessageResponse]`, newest first. |

**Floor Updates** (`backend/app/api/routes/floor_updates.py`, two routers: `/floors` + `/updates`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/floors/{floor_id}/updates` | Create update. Body: `FloorUpdateCreate`. Returns `FloorUpdateResponse`. Broadcasts via floor WS. |
| GET | `/floors/{floor_id}/updates` | Per-floor updates. Query: `priority` (optional filter), `include_expired` (bool, default false). |
| GET | `/updates/latest` | Cross-floor latest. Query: `limit` (int, default 10). Sorted by priority rank then recency. Excludes expired. |
| PATCH | `/updates/{update_id}` | Resolve/unresolve. Body: `{"resolved": bool}`. Returns updated `FloorUpdateResponse`. |

### New Pydantic Models

**`backend/app/models/chat.py`**

```python
class ChatMessageCreate(BaseModel):
    sender: str
    role: Literal["user", "agent", "system"]
    content: str

class ChatMessageResponse(BaseModel):
    # ConfigDict with to_camel alias
    id: int
    floor_id: str
    sender: str
    role: str
    content: str
    timestamp: datetime
```

**`backend/app/models/floor_updates.py`**

```python
PRIORITY_ORDER: dict[str, int] = {"critical": 0, "alert": 1, "info": 2, "report": 3}

class FloorUpdateCreate(BaseModel):
    priority: Literal["critical", "alert", "info", "report"]
    title: str
    body: str
    auto_expire_hours: int = 24

class FloorUpdateResponse(BaseModel):
    # ConfigDict with to_camel alias
    id: int
    floor_id: str
    priority: str
    title: str
    body: str
    timestamp: datetime
    auto_expire_hours: int
    resolved: bool
```

### WebSocket Extensions

**`ConnectionManager` additions** (`backend/app/api/websocket.py`):
- `floor_connections: dict[str, list[WebSocket]]` — mirrors `room_connections` pattern
- `connect_floor(websocket, floor_id)` — accept and register
- `disconnect_floor(websocket, floor_id)` — remove
- `broadcast_floor(message, floor_id)` — send to all floor subscribers

**New endpoint** in `main.py`:
- `WS /ws/floor/{floor_id}` — floor-level WebSocket, keep-alive via receive loop

**Broadcast event formats:**

```json
{"type": "chat_message", "floor_id": "dev_software", "message": {<ChatMessageResponse camelCase>}}
{"type": "floor_update", "floor_id": "dev_software", "update": {<FloorUpdateResponse camelCase>}}
```

### Auto-Expiry Logic

Enforced at query time in GET endpoints:
- Non-critical updates: expired if `now() > timestamp + timedelta(hours=auto_expire_hours)`
- Critical updates: never expire regardless of `auto_expire_hours`; resolved via PATCH only
- `include_expired=true` query param bypasses expiry filter
- `/updates/latest` always excludes expired non-critical updates

### File Changes Summary

| File | Action |
|------|--------|
| `backend/app/db/models.py` | Add `ChatMessageRecord`, `FloorUpdateRecord` |
| `backend/app/models/chat.py` | New |
| `backend/app/models/floor_updates.py` | New |
| `backend/app/api/routes/chat.py` | New |
| `backend/app/api/routes/floor_updates.py` | New |
| `backend/app/api/websocket.py` | Extend `ConnectionManager` with floor methods |
| `backend/app/main.py` | Register routers + add `/ws/floor/{floor_id}` endpoint |
| `backend/tests/test_chat.py` | New |
| `backend/tests/test_floor_updates.py` | New |
| `backend/tests/test_floor_websocket.py` | New |

## Testing Strategy

- **Functional tests** via pytest + pytest-asyncio using in-memory SQLite (`conftest.py` fixture)
- **API tests** using `httpx.AsyncClient` with FastAPI's test transport
- **WebSocket tests** using Starlette `TestClient` WebSocket support
- No browser-based testing (backend only)
- No Alembic migrations to test

## Success Criteria

All must pass. `uv` path: `/Users/albertocastrobravo/.local/bin/uv`.

### SC-1: Chat table and model exist
```bash
rg "class ChatMessageRecord" backend/app/db/models.py
rg '__tablename__ = "chat_messages"' backend/app/db/models.py
```

### SC-2: FloorUpdate table and model exist
```bash
rg "class FloorUpdateRecord" backend/app/db/models.py
rg '__tablename__ = "floor_updates"' backend/app/db/models.py
```

### SC-3: Chat Pydantic models exist
```bash
rg "class ChatMessageCreate" backend/app/models/chat.py
rg "class ChatMessageResponse" backend/app/models/chat.py
```

### SC-4: FloorUpdate Pydantic models exist
```bash
rg "class FloorUpdateCreate" backend/app/models/floor_updates.py
rg "class FloorUpdateResponse" backend/app/models/floor_updates.py
```

### SC-5: Chat REST endpoints registered
```bash
rg "chat.router" backend/app/main.py
```

### SC-6: FloorUpdate REST endpoints registered
```bash
rg "floor_updates.router" backend/app/main.py
```

### SC-7: Floor WebSocket infrastructure exists
```bash
rg "floor_connections" backend/app/api/websocket.py
rg "broadcast_floor" backend/app/api/websocket.py
rg "ws/floor" backend/app/main.py
```

### SC-8: All tests pass (no regressions)
```bash
cd backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/ -v --tb=short
```

### SC-9: Ruff passes
```bash
cd backend && /Users/albertocastrobravo/.local/bin/uv run ruff check . --exclude '*2.py'
```
Note: `--exclude '*2.py'` skips macOS Finder duplicate files that have pre-existing ruff errors.

### SC-10: New test files exist and pass
```bash
cd backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/test_chat.py tests/test_floor_updates.py tests/test_floor_websocket.py -v
```
