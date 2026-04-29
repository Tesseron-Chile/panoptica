# Ralph Coder Prompt — Run A-2, Phase C C8 Fixes

You are the **coder agent** (🔨) in the Ralph workflow (Phase C, C8).

## Workflow skill

`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

## Repo & branch

- Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
- Feature branch: `ralph/ebcdeee9`
- PR: #8 (Tesseron-Chile/panoptica)

## Your job

Fix all 5 reviewer findings (2 Minor + 3 Nit). `nit_tolerance=low` — fix all of them.

## Fix 1 — Minor: `get_latest_updates` unbounded query (floor_updates.py)

In `backend/app/api/routes/floor_updates.py`, the `get_latest_updates` endpoint loads ALL `FloorUpdateRecord` rows into memory then filters in Python.

Add a SQL-level guard: filter out resolved records at the DB level, and cap the query to at most 500 rows. Keep Python-side expiry filtering as-is.

**Before (approximate):**
```python
result = await db.execute(select(FloorUpdateRecord))
records = result.scalars().all()
```

**After:**
```python
result = await db.execute(
    select(FloorUpdateRecord)
    .where(FloorUpdateRecord.resolved == False)  # noqa: E712
    .limit(500)
)
records = result.scalars().all()
```

## Fix 2 — Minor: Add `max_length` to string fields

In `backend/app/models/chat.py` — add Field constraints:
```python
from pydantic import Field

class ChatMessageCreate(BaseModel):
    sender: str = Field(max_length=200)
    role: Literal["user", "agent", "system"]
    content: str = Field(max_length=10000)
```

In `backend/app/models/floor_updates.py` — add Field constraints:
```python
from pydantic import Field

class FloorUpdateCreate(BaseModel):
    priority: Literal["critical", "alert", "info", "report"]
    title: str = Field(max_length=500)
    body: str = Field(max_length=5000)
    auto_expire_hours: int = 24
```

## Fix 3 — Nit: `FloorUpdateResponse.priority` should be `Literal`

In `backend/app/models/floor_updates.py`, change:
```python
priority: str
```
to:
```python
priority: Literal["critical", "alert", "info", "report"]
```

## Fix 4 — Nit: Redundant exception tuple in websocket endpoint (main.py)

Find the `websocket_floor_endpoint` in `backend/app/main.py`. Change:
```python
except (WebSocketDisconnect, Exception):
```
to:
```python
except Exception:
```

## Fix 5 — Nit: Remove unused `logger` from chat.py and floor_updates.py

In `backend/app/api/routes/chat.py` — remove:
```python
import logging
logger = logging.getLogger(__name__)
```

In `backend/app/api/routes/floor_updates.py` — remove:
```python
import logging
logger = logging.getLogger(__name__)
```

## Verification

After all fixes:
```bash
cd /Users/albertocastrobravo/Documents/MJM/panoptica/backend
/Users/albertocastrobravo/.local/bin/uv run pytest tests/test_chat.py tests/test_floor_updates.py tests/test_floor_websocket.py tests/ -v --tb=short
```
All 395 tests must pass. Then:
```bash
/Users/albertocastrobravo/.local/bin/uv run ruff check . --exclude '*2.py'
```
Must be clean.

## Commit and push

```bash
git add backend/app/api/routes/chat.py backend/app/api/routes/floor_updates.py backend/app/models/chat.py backend/app/models/floor_updates.py backend/app/main.py
git commit -m "fix(chat,floor-updates): C8 — add max_length validation, bound latest query, fix response Literal, remove unused logger, fix redundant except"
git push origin ralph/ebcdeee9
```

## Critical notes

- `uv` NOT on PATH — use `/Users/albertocastrobravo/.local/bin/uv`
- Ignore " 2" files — do NOT commit them
- `ruff check` must use `--exclude '*2.py'`
- pyright 551 pre-existing errors — expected, ignore
- Making zero changes is NOT valid here — all 5 findings must be addressed
- Exit after committing
