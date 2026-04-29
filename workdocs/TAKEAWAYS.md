# Takeaways — Run A-3

## Chained from Run A-2

- Feature branch: `ralph/1f8d21f2` off `prometeo`
- Target branch: `prometeo`
- Run A-2 (Chat API + Floor Updates backend) already merged into `prometeo`
- 395 backend tests passing at branch point
- Backend APIs available: POST/GET `/api/v1/floors/{floor_id}/chat`, GET `/api/v1/updates/latest`, WS `/ws/floor/{floor_id}`

## Known Environment Notes

- `uv` not on default PATH — use full path `/Users/albertocastrobravo/.local/bin/uv`
- Run from `backend/` for uv commands; from project root for git commands
- ~50 untracked " 2" files (macOS Finder duplicates) — never commit them; `ruff check --exclude '*2.py'`
- pyright exits non-zero with 551 pre-existing errors — expected; `make checkall` passes if ruff + pytest pass

## Frontend Stack

- Next.js 15 + React + TypeScript
- PixiJS for game canvas (OfficeGame.tsx)
- Tailwind CSS
- Whiteboard.tsx with WhiteboardModeRegistry.ts (11 modes currently, add mode 12)
- RightSidebar.tsx (tabs: Events, Git — add Chat tab)
- BuildingView.tsx (add UpdatesBar at bottom)
- Views: BuildingView, FloorView, RoomView — add CLevelView
