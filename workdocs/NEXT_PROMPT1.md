# Ralph Designer Prompt — Run A-3, Phase A

You are the **designer agent** (🎨) in the Ralph workflow (Phase A).

## Context

Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
Feature branch: `ralph/1f8d21f2` (already checked out, based on `prometeo`)
Target branch: `prometeo`

Run A-3 is the **frontend** run for Prometeo. The backend APIs (chat + floor updates + WebSocket) were built and merged in Run A-2. Your job is to write SPEC.md, PLAN.md, and SETUP.md for the frontend work.

## Design reference

The approved design is at: `docs/superpowers/specs/2026-04-28-prometeo-company-os-design.md`

Read sections: "Section 3 — Chat", "Section 4 — Updates Board", "Section 5 — C-Level Floor", and "Run A-3" in the implementation roadmap.

**A-3 scope** (do NOT exceed this):
1. **Chat tab** in `RightSidebar` — new tab alongside Events and Git; shows chat history (bubbles), input to send to floor boss; connects to `GET/POST /api/v1/floors/{floor_id}/chat` + WS `/ws/floor/{floor_id}` for live updates
2. **Updates bar** in `BuildingView` — fixed strip at the bottom showing top 3 updates from `GET /api/v1/updates/latest`; color-coded by priority (critical=#ef4444, alert=#f59e0b, info=#22c55e, report=#3b82f6)
3. **Whiteboard mode 12** — "Updates" mode added to `WhiteboardModeRegistry`; keyboard shortcut `U`; shows floor updates list for the active floor
4. **CLevelView básico** — new React component (NOT PixiJS) that replaces `FloorView` when the floor is the C-Level floor; two columns minimum: left = floor status cards (one per dept, LED color by latest update priority), right = C-Level chat (same chat component reused); "básico" means minimal viable, no Architect column yet

## Key files to explore

```
frontend/src/components/layout/RightSidebar.tsx
frontend/src/components/views/BuildingView.tsx
frontend/src/components/views/FloorView.tsx
frontend/src/components/game/Whiteboard.tsx
frontend/src/components/game/whiteboard/WhiteboardModeRegistry.ts
frontend/src/
```

Also check for:
- Existing WebSocket usage (how does the frontend connect to `/ws/room/{room_id}`?)
- How the current tab system works in RightSidebar
- How BuildingView receives floor updates or state
- The backend API base URL pattern (look for `NEXT_PUBLIC_API_URL` or fetch calls)
- How `FloorView` gets selected/rendered to understand where to inject CLevelView
- TypeScript types/interfaces for floor data

## Backend API reference (already implemented)

```
POST /api/v1/floors/{floor_id}/chat   body: {sender, role, content}
GET  /api/v1/floors/{floor_id}/chat   query: ?before=<id>&limit=<n>
GET  /api/v1/updates/latest           query: ?limit=<n>&priority=<p>
PATCH /api/v1/updates/{id}/resolve
WS   /ws/floor/{floor_id}            — broadcasts {type:"chat_message"|"floor_update", ...}
```

Response shapes (camelCase):
- ChatMessage: `{id, floorId, sender, role, content, timestamp}`
- FloorUpdate: `{id, floorId, priority, title, body, timestamp, autoExpireHours, resolved}`

## Your deliverables

Write these three files to `workdocs/`:

### SPEC.md
- Requirements for each of the 4 features
- Component breakdown (which files to create/modify)
- Programmatically verifiable success criteria (TypeScript compilation, `npm run build` passes, component smoke tests if applicable)
- Non-functional: no regressions in existing tests/build

### PLAN.md
Tasks with status markers (⬜). Each task must be small enough for one focused coder session (~15-20 min). Suggested task breakdown:
- T1: Chat tab component + RightSidebar integration
- T2: Updates bar in BuildingView  
- T3: Whiteboard mode 12 (Updates Board)
- T4: CLevelView básico

For each task: files to touch, success criteria, how to verify.

### SETUP.md
Frontend dev environment for coder agents:
- How to run frontend dev server
- How to check TypeScript compilation
- How to run any existing frontend tests
- Environment variables needed (API URL etc.)
- Key patterns to follow (how to fetch data, how existing tabs work, etc.)

## Important notes

- `uv` NOT on PATH — use `/Users/albertocastrobravo/.local/bin/uv` (for backend commands only)
- Do NOT run `npm install` — assume frontend deps are installed
- This is frontend-only — do NOT modify backend files
- Do NOT add tests that require a running browser (Playwright/Cypress) unless they already exist in the project
- Check if there's already a `jest` or `vitest` setup for component tests before adding them to SPEC criteria
- After writing workdocs, commit them: `git add workdocs/ && git commit -m "chore(workdocs): Phase A — SPEC + PLAN + SETUP for Run A-3"`
- Then push: `git push origin ralph/1f8d21f2`
- Exit after committing

## Workflow notes

- Do NOT implement anything — only write SPEC.md, PLAN.md, SETUP.md
- Write concise, information-dense workdocs (skip obvious details)
- Do NOT create extra files beyond SPEC.md, PLAN.md, SETUP.md
