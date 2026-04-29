# Ralph Designer Prompt — Run A-2

You are the **designer agent** (🎨) in the Ralph workflow (Phase A).

## Workflow skill

`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

Read the full skill, then continue from step **A11**.

## Repo & branch

- Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
- Feature branch: `ralph/ebcdeee9`
- Target branch: `prometeo`
- Repo: `Tesseron-Chile/panoptica`

## Workdocs to read

- `workdocs/USER_PROMPT.md`
- `workdocs/TAKEAWAYS.md` — contains scope decision and key notes
- `docs/superpowers/specs/2026-04-28-prometeo-company-os-design.md` — approved design (primary reference)

## Discovery interview (A12)

**Skip the human interview.** The orchestrator acts as interviewee. The design is pre-approved. Use the existing design doc as the primary source of truth.

## Scope (CRITICAL — read before exploring)

**Run A-2 is BACKEND ONLY.** The orchestrator made this scope decision.

| In scope | Out of scope (→ Run A-3) |
|----------|--------------------------|
| `chat_messages` SQLite table + Alembic migration | Whiteboard mode 12 |
| Chat REST endpoints (POST, GET with filters) | Updates bar in BuildingView |
| Chat WebSocket broadcast per floor | Tab Chat in RightSidebar |
| `FloorUpdate` model + `floor_updates` SQLite table | CLevelView |
| FloorUpdate REST endpoints | Any PixiJS/React changes |
| Tests: CRUD, WebSocket broadcast, floor filters | |

Do NOT include any frontend tasks. Frontend is Run A-3.

## Key architecture context

- Backend: FastAPI + SQLite (via aiosqlite/SQLAlchemy or raw sqlite3 — check existing pattern in `backend/`)
- WebSocket: existing WebSocket infrastructure in `backend/app/api/websocket.py` — extend it, don't replace
- Floor routing: `floor_id` is already in `EventData` model and propagated via `CLAUDE_OFFICE_FLOOR_ID` env var (Run A-1)
- Existing tests: 345 backend tests passing — no regressions allowed
- `uv` full path: `/Users/albertocastrobravo/.local/bin/uv` (not on default PATH)

## What to produce

1. `workdocs/SPEC.md` — spec with programmatically verifiable success criteria (backend only)
2. `workdocs/PLAN.md` — tasks with ⬜ status markers, each sized for one coder session
3. `workdocs/SETUP.md` — project-specific setup for backend (uv path, pytest commands, etc.)
4. Update `workdocs/TAKEAWAYS.md` with Phase A design decisions

## Important notes

- Ignore untracked files with " 2" suffix (macOS Finder duplicates) — do NOT commit them
- pyright fails with 551 pre-existing errors — `make checkall` is passing if ruff + pytest pass
- Check `backend/app/db/` and `backend/app/models/` to understand existing DB/model patterns before designing new ones
- Check existing WebSocket code before designing broadcast — don't duplicate infrastructure
- Commit workdocs frequently; tell the orchestrator "Phase A complete" when done
