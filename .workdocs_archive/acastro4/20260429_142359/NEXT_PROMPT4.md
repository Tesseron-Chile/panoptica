# Ralph Coder Prompt — Run A-2, T3: Floor WebSocket

You are the **coder agent** (🔨) in the Ralph workflow (Phase B).

## Workflow skill

`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

Read the full skill, then continue from step **B2**.

## Repo & branch

- Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
- Feature branch: `ralph/ebcdeee9`
- Target branch: `prometeo`

## Workdocs to read

- `workdocs/SPEC.md`
- `workdocs/PLAN.md`
- `workdocs/SETUP.md`
- `workdocs/TAKEAWAYS.md`

## Your task

Pick **T3** from PLAN.md (Floor-level WebSocket infrastructure + broadcast integration + tests). T1 and T2 are both ✅.

## Critical notes

- `uv` is NOT on default PATH — use `/Users/albertocastrobravo/.local/bin/uv` for all uv commands
- Run uv commands from `backend/` directory; git commands from project root
- Ignore all untracked files ending in " 2" (e.g. `agent_runner 2.py`) — macOS Finder duplicates, do NOT commit them
- `ruff check` must use `--exclude '*2.py'` to avoid linting those duplicates
- pyright fails with 551 pre-existing errors — expected; only ruff + pytest must pass
- Read `backend/app/api/websocket.py` carefully FIRST — mirror the existing `room_connections` pattern exactly (just s/room/floor/)
- T1 created `backend/app/api/routes/chat.py` and T2 created `backend/app/api/routes/floor_updates.py` — you need to add `broadcast_floor` calls into BOTH those files after the POST creates a record
- WS test pattern: use `starlette.testclient.TestClient` with `with client.websocket_connect(...)` context manager
