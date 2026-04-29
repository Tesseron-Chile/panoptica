# SETUP — Run A-3: Frontend Dev Environment

## Dev Server

```bash
cd frontend
npm run dev          # Next.js dev with Turbopack on http://localhost:3000
```

Backend must be running on `http://localhost:8000` for API calls and WebSocket. Start via:
```bash
cd backend
/Users/albertocastrobravo/.local/bin/uv run uvicorn app.main:app --reload --port 8000
```

Or from root: `make dev-tmux` (runs both in tmux).

## Verification Commands

```bash
cd frontend
npx tsc --noEmit       # TypeScript compilation check
npm run build           # Production build (Next.js)
npx vitest run          # Run tests (currently 1 smoke test)
npm run lint            # ESLint with zero warnings threshold
```

## Key Patterns

### API calls
Plain `fetch` to hardcoded base URL. No axios, no env var abstraction:
```typescript
const res = await fetch("http://localhost:8000/api/v1/floors");
const data = await res.json();
```

### WebSocket
See `frontend/src/hooks/useWebSocketEvents.ts` for the existing pattern:
```typescript
const ws = new WebSocket(`ws://localhost:8000/ws/room/${roomId}`);
ws.onmessage = (e) => { const msg = JSON.parse(e.data); /* handle */ };
```
For A-3, the new floor WS endpoint is: `ws://localhost:8000/ws/floor/{floorId}`
Message types: `{type: "chat_message", ...}` and `{type: "floor_update", ...}`

### State management
- **Global state:** Zustand stores in `frontend/src/stores/` (gameStore, navigationStore, preferencesStore, tourStore, attentionStore)
- **Component/hook-local state:** React `useState` + `useEffect`
- **Navigation:** `useNavigationStore()` provides `floorId`, `view`, `buildingConfig`, `goToFloor()`, `goToBuilding()`

### Tab system (RightSidebar)
- State: `useState<"events" | "conversation">("events")` — extend to include `"chat"`
- Each tab is a button with conditional accent color styling
- Content: conditional render based on active tab value

### Whiteboard modes
- Type: `WhiteboardMode` union in `frontend/src/types/index.ts` (currently `0 | 1 | ... | 11`)
- Registry: `WhiteboardModeRegistry.ts` — `MODE_INFO` record + `WHITEBOARD_MODE_COUNT`
- Rendering: `Whiteboard.tsx` has `renderMode()` switch statement + keydown handler for shortcuts
- Each mode is a standalone component receiving whiteboard data via props or hooks

### View routing
- `page.tsx` reads `view` from `useNavigationStore` ("building" | "floor")
- `ViewTransition` component handles animated switching
- FloorView is always mounted (hidden via CSS when not active) to avoid PixiJS remounting
- CLevelView has no PixiJS, so it can be conditionally rendered

## Files Reference

| Purpose | Path |
|---------|------|
| Main page | `frontend/src/app/page.tsx` |
| RightSidebar | `frontend/src/components/layout/RightSidebar.tsx` |
| BuildingView | `frontend/src/components/views/BuildingView.tsx` |
| FloorView | `frontend/src/components/views/FloorView.tsx` |
| ViewTransition | `frontend/src/components/navigation/ViewTransition.tsx` |
| Whiteboard | `frontend/src/components/game/Whiteboard.tsx` |
| Mode registry | `frontend/src/components/game/whiteboard/WhiteboardModeRegistry.ts` |
| WebSocket hook | `frontend/src/hooks/useWebSocketEvents.ts` |
| Navigation store | `frontend/src/stores/navigationStore.ts` |
| Types (frontend) | `frontend/src/types/index.ts` |
| Types (navigation) | `frontend/src/types/navigation.ts` |
| Smoke test | `frontend/tests/smoke.test.ts` |

## Backend API (already implemented in A-2)

```
POST /api/v1/floors/{floor_id}/chat     {sender, role, content} → ChatMessage
GET  /api/v1/floors/{floor_id}/chat     ?before=<id>&limit=<n> → ChatMessage[]
GET  /api/v1/updates/latest             ?limit=<n>&priority=<p> → FloorUpdate[]
PATCH /api/v1/updates/{id}/resolve      → FloorUpdate
WS   /ws/floor/{floor_id}              → {type: "chat_message"|"floor_update", ...}
```

## Do NOT

- Install new npm packages — use native `fetch`, `WebSocket`, existing deps
- Modify backend files
- Add Playwright/Cypress tests
- Use `uv` for frontend (it's for backend Python only)
