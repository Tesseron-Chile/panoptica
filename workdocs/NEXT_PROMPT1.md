# Ralph Designer Prompt — Run A-3, Phase A

You are the **designer agent** (🎨) in the Ralph workflow (Phase A).

**CRITICAL: Do NOT use the Agent tool or Task tool. Do all exploration with Read and Bash directly in this session.**

## Context

Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
Feature branch: `ralph/1f8d21f2` (already checked out, based on `prometeo`)
Target branch: `prometeo`

Run A-3 is the **frontend** run for Prometeo. The backend APIs (chat + floor updates + WebSocket) were built and merged in Run A-2. Your job is to write SPEC.md, PLAN.md, and SETUP.md for the frontend work.

## Design reference

Read sections relevant to A-3 in `docs/superpowers/specs/2026-04-28-prometeo-company-os-design.md`:
- Section 3 (Chat), Section 4 (Updates Board), Section 5 (C-Level Floor), and the A-3 entry in the implementation roadmap.

**A-3 scope** (do NOT exceed this):
1. **Chat tab** in `RightSidebar` — new tab alongside Events and Git; shows chat history (bubbles), input to send to floor boss; connects to `GET/POST /api/v1/floors/{floor_id}/chat` + WS `/ws/floor/{floor_id}` for live updates
2. **Updates bar** in `BuildingView` — fixed strip at the bottom showing top 3 updates from `GET /api/v1/updates/latest`; color-coded by priority (critical=#ef4444, alert=#f59e0b, info=#22c55e, report=#3b82f6)
3. **Whiteboard mode 12** — "Updates" mode added to `WhiteboardModeRegistry`; keyboard shortcut `U`; shows floor updates list for the active floor via `GET /api/v1/floors/{floor_id}/updates`
4. **CLevelView básico** — new React component (NOT PixiJS) replacing `FloorView` for the C-Level floor; two columns minimum: left = floor status cards (one per dept, LED color by latest update priority), right = C-Level chat (reuse chat component)

## Key files to explore with Read/Bash

Explore these files directly — do NOT spawn agents:

```bash
# Read these files to understand the codebase:
# frontend/src/components/layout/RightSidebar.tsx
# frontend/src/components/views/BuildingView.tsx
# frontend/src/components/views/FloorView.tsx
# frontend/src/components/game/Whiteboard.tsx
# frontend/src/components/game/whiteboard/WhiteboardModeRegistry.ts
# frontend/src/app/page.tsx
```

Also check for:
- How existing WS connections work: `grep -r "WebSocket\|ws://" frontend/src --include="*.tsx" --include="*.ts" -l`
- How tabs work in RightSidebar (read the file)
- API base URL pattern: `grep -r "NEXT_PUBLIC\|api/v1\|fetch(" frontend/src --include="*.ts" --include="*.tsx" -l`
- How FloorView is selected: where does the app decide which view to render?
- Existing types: `grep -r "FloorData\|Floor \|floor_id\|floorId" frontend/src --include="*.ts" --include="*.tsx" -l`

## Backend API reference (already implemented)

```
POST /api/v1/floors/{floor_id}/chat   body: {sender, role, content}
GET  /api/v1/floors/{floor_id}/chat   query: ?before=<id>&limit=<n>
GET  /api/v1/floors/{floor_id}/updates query: ?priority=<p>&include_expired=<bool>
GET  /api/v1/updates/latest           query: ?limit=<n>&priority=<p>
PATCH /api/v1/updates/{id}/resolve
WS   /ws/floor/{floor_id}            — broadcasts {type:"chat_message"|"floor_update", payload:{...}}
```

Response shapes (camelCase):
- ChatMessage: `{id, floorId, sender, role, content, timestamp}`
- FloorUpdate: `{id, floorId, priority, title, body, timestamp, autoExpireHours, resolved}`

## Your deliverables

Write these three files to `workdocs/`:

### SPEC.md
- Requirements for each of the 4 features
- Component breakdown (which files to create/modify)
- Programmatically verifiable success criteria (TypeScript compilation must pass: `cd frontend && npx tsc --noEmit`, no existing tests broken)
- Non-functional: no regressions in existing build

### PLAN.md
Tasks with status markers (⬜). Suggested breakdown:
- T1: Chat tab component + RightSidebar integration
- T2: Updates bar in BuildingView
- T3: Whiteboard mode 12 (Updates Board)
- T4: CLevelView básico

For each task: files to touch, key implementation notes, success criteria.

### SETUP.md
Frontend dev environment for coder agents:
- How to start dev server: `cd frontend && npm run dev`
- How to check TypeScript: `cd frontend && npx tsc --noEmit`
- API base URL: how to configure/find it
- Key patterns to follow (tab system, data fetching, WS connection pattern)
- How to check if CLevelView should render (how does app identify C-Level floor)

## Important notes

- Do NOT modify any backend files
- Do NOT run `npm install` — deps are already installed
- `uv` NOT on PATH — use `/Users/albertocastrobravo/.local/bin/uv` (backend only, you won't need it)
- The " 2" files in the repo are macOS Finder duplicates — ignore them entirely
- After writing workdocs, commit: `git add workdocs/ && git commit -m "chore(workdocs): Phase A — SPEC + PLAN + SETUP for Run A-3"`
- Then push: `git push origin ralph/1f8d21f2`
- Exit after committing

## Workflow rules

- Do NOT implement anything — only write SPEC.md, PLAN.md, SETUP.md
- Do NOT use the Agent tool or Task tool — use Read and Bash directly
- Write concise, information-dense workdocs
