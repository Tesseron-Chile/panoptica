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

### API Calls
Plain `fetch` to hardcoded base URL. No axios, no env var abstraction:
```typescript
const API_URL = "http://localhost:8000/api/v1";
const res = await fetch(`${API_URL}/floors`);
const data = await res.json();
```
See `frontend/src/hooks/useFloorConfig.ts` for the canonical pattern.

### WebSocket
See `frontend/src/hooks/useWebSocketEvents.ts` for existing connection pattern:
- `useRef<WebSocket>` to hold connection
- Connection ID ref to prevent stale handlers
- Cleanup in `useEffect` return
- Reconnect on close with timeout

For A-3, the floor WS endpoint is: `ws://localhost:8000/ws/floor/{floorId}`
- Server pushes: `{type: "chat_message", floor_id, message: ChatMessage}` and `{type: "floor_update", floor_id, update: FloorUpdate}`
- Client is read-only on WS — chat messages are sent via REST POST, not WS

### State Management
- **Global state:** Zustand stores in `frontend/src/stores/` (gameStore, navigationStore, preferencesStore, tourStore, attentionStore)
- **Component/hook-local state:** React `useState` + `useEffect` — use for chat/updates since it's component-scoped
- **Navigation:** `useNavigationStore()` provides `floorId`, `view`, `buildingConfig`, `goToFloor()`, `goToBuilding()`

### Tab System (RightSidebar)
- State: `useState<"events" | "conversation">("events")` — extend to `"events" | "conversation" | "chat"`
- Each tab is a `<button>` with conditional accent color class
- Active styles: events=orange, conversation=cyan, chat=violet
- Content: conditional render based on `activeTab` value
- File: `frontend/src/components/layout/RightSidebar.tsx`

### Whiteboard Modes
- Type: `WhiteboardMode` union in `frontend/src/types/index.ts` (currently `0 | 1 | ... | 11`)
- Registry: `WhiteboardModeRegistry.ts` — `MODE_INFO` record + `WHITEBOARD_MODE_COUNT` (currently 12)
- GameStore: `WHITEBOARD_MODE_COUNT` (currently 11 — inconsistent with registry, both need updating to 13)
- Rendering: `Whiteboard.tsx` → `renderMode()` switch + `handleKeyDown` for shortcuts
- Each mode is a standalone component. Follow `KanbanMode.tsx` as reference for new PixiJS modes.
- Mode indicator dots: `Array.from({ length: 12 })` in `Whiteboard.tsx` — update to 13

### View Routing
- `page.tsx` reads `view` from `useNavigationStore` (`"building" | "floor"`)
- `ViewTransition` handles animated switching between views
- FloorView is always mounted (hidden via CSS `display: none`) to avoid PixiJS remounting
- For CLevelView (no PixiJS), pass it as the `floorView` prop instead of FloorView — no duplication issue

### How to Identify C-Level Floor
- `floors.toml` has `is_c_level = true` on the C-Level floor
- Backend serializes it as `isCLevel` via Pydantic camelCase alias
- Frontend `FloorConfig` needs `isCLevel?: boolean` added to accept it
- Check: `buildingConfig.floors.find(f => f.id === floorId)?.isCLevel === true`

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
| KanbanMode (reference) | `frontend/src/components/game/whiteboard/KanbanMode.tsx` |
| WebSocket hook | `frontend/src/hooks/useWebSocketEvents.ts` |
| Floor config hook | `frontend/src/hooks/useFloorConfig.ts` |
| Navigation store | `frontend/src/stores/navigationStore.ts` |
| Game store | `frontend/src/stores/gameStore.ts` |
| Types (game) | `frontend/src/types/index.ts` |
| Types (navigation) | `frontend/src/types/navigation.ts` |
| floors.toml | `backend/floors.toml` |

## Backend API (implemented in A-2)

```
POST /api/v1/floors/{floor_id}/chat     {sender, role, content} → ChatMessage
GET  /api/v1/floors/{floor_id}/chat     ?before=<id>&limit=<n> → ChatMessage[] (newest-first)
GET  /api/v1/floors/{floor_id}/updates  ?priority=<p>&include_expired=<bool> → FloorUpdate[]
GET  /api/v1/updates/latest             ?limit=<n>&priority=<p> → FloorUpdate[]
PATCH /api/v1/updates/{id}/resolve      {resolved: true} → FloorUpdate
WS   /ws/floor/{floor_id}              → pushes chat_message / floor_update events
```

### Response Shapes (camelCase)
```typescript
// ChatMessage: {id: number, floorId, sender, role, content, timestamp}
// FloorUpdate: {id: number, floorId, priority, title, body, timestamp, autoExpireHours, resolved}
```

## Do NOT

- Install new npm packages — use native `fetch`, `WebSocket`, existing deps
- Modify backend files
- Add Playwright/Cypress tests
- Use `uv` for frontend (it's for backend Python only)
- Use `NEXT_PUBLIC_` env vars for API URL — hardcode `http://localhost:8000/api/v1`
