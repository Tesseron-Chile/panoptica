# SETUP.md — Run A-2

## Environment

- **Python:** Managed by `uv` at `/Users/albertocastrobravo/.local/bin/uv`
- **Working directory for uv/pytest:** `backend/`
- **Working directory for git:** project root (`/Users/albertocastrobravo/Documents/MJM/panoptica`)

## Commands

### Run all tests
```bash
cd backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/ -v
```

### Run a specific test file
```bash
cd backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/test_chat.py -v
```

### Run a specific test
```bash
cd backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/test_chat.py::test_create_chat_message -v
```

### Run ruff linter
```bash
cd backend && /Users/albertocastrobravo/.local/bin/uv run ruff check .
```

### Run ruff format check
```bash
cd backend && /Users/albertocastrobravo/.local/bin/uv run ruff format --check .
```

### Full validation (matches `make checkall` pass criteria)
```bash
cd backend && /Users/albertocastrobravo/.local/bin/uv run ruff check . && /Users/albertocastrobravo/.local/bin/uv run ruff format --check . && /Users/albertocastrobravo/.local/bin/uv run pytest tests/ -v
```

## Notes

- **pyright:** Exits non-zero with 551 pre-existing errors — not a blocker. `make checkall` passes if ruff + pytest pass.
- **Test DB:** Tests use in-memory SQLite. The `conftest.py` session-scoped fixture `setup_test_database()` creates all tables via `Base.metadata.create_all()`. New tables (`chat_messages`, `floor_updates`) will be created automatically.
- **No Alembic:** New tables are created by `create_all()` — no migration scripts needed.
- **API testing:** Use `httpx.AsyncClient` with `ASGITransport(app=app)` for async API tests. Import `app` from `app.main`.
- **WebSocket testing:** Use `starlette.testclient.TestClient` with `client.websocket_connect(url)` for sync WebSocket tests.
- **httpx dependency:** Verify `httpx` is available (`/Users/albertocastrobravo/.local/bin/uv run python -c "import httpx"`). If missing: `/Users/albertocastrobravo/.local/bin/uv add --dev httpx`.
- **Untracked " 2" files:** ~50 files with " 2" suffix are macOS Finder duplicates — ignore them, do NOT commit.
