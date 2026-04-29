# SPEC — Run A-3: Frontend (Chat + Updates + CLevelView)

## Scope

Four frontend features on top of backend APIs from Run A-2.

---

## F1 — Chat Tab in RightSidebar

**What:** New "Chat" tab in `RightSidebar` (alongside Events and Conversation). Shows chat history for the active floor with message bubbles (user vs agent) and an input field.

**API integration:**
- `GET /api/v1/floors/{floorId}/chat?limit=50` — load history (returns `ChatMessage[]`, newest-first; reverse for display)
- `POST /api/v1/floors/{floorId}/chat` — send `{sender: "user", role: "user", content: "..."}`
- WS `ws://localhost:8000/ws/floor/{floorId}` — listen for `{type: "chat_message", floor_id, message: ChatMessage}`

**Files:**
| File | Action |
|------|--------|
| `frontend/src/types/prometeo.ts` | **Create** — `ChatMessage`, `FloorUpdate` interfaces |
| `frontend/src/hooks/useFloorChat.ts` | **Create** — fetch history, send, WS subscription |
| `frontend/src/components/chat/ChatTab.tsx` | **Create** — message list + input |
| `frontend/src/components/layout/RightSidebar.tsx` | **Modify** — add third tab "Chat", extend `activeTab` union to `"events" | "conversation" | "chat"` |

**Behavior:**
- `floorId` from `useNavigationStore().floorId`; tab hidden when `floorId` is null (building view)
- On tab switch / floor change: fetch latest 50 messages, reverse to chronological order
- WS `chat_message` events append to list in real time
- User bubbles right-aligned (purple accent), agent/system bubbles left-aligned (slate)
- Input: Enter sends, disable during POST, clear on success
- Auto-scroll to bottom on new message

---

## F2 — Updates Bar in BuildingView

**What:** Fixed strip at the bottom of `BuildingView` showing top 3 updates across all floors.

**API:** `GET /api/v1/updates/latest?limit=3` — polled every 30s

**Files:**
| File | Action |
|------|--------|
| `frontend/src/hooks/useLatestUpdates.ts` | **Create** — fetch + poll hook |
| `frontend/src/components/updates/UpdatesBar.tsx` | **Create** — horizontal bar |
| `frontend/src/components/views/BuildingView.tsx` | **Modify** — render `<UpdatesBar />` below foundation |

**Behavior:**
- Horizontal bar, dark background (`bg-slate-900`), full width, below the foundation div
- Each update: colored dot by priority + floor name/icon + title + relative time
- Priority colors: critical=`#ef4444`, alert=`#f59e0b`, info=`#22c55e`, report=`#3b82f6`
- Empty state: subtle "No updates" text or hidden
- Click update → navigate to that floor via `goToFloor(update.floorId)`

---

## F3 — Whiteboard Mode 12 (Updates Board)

**What:** New whiteboard mode "UPDATES" (index 12, shortcut `U`) showing floor updates.

**API:** `GET /api/v1/floors/{floorId}/updates` — fetched on mode activation

**Files:**
| File | Action |
|------|--------|
| `frontend/src/components/game/whiteboard/UpdatesMode.tsx` | **Create** — PixiJS mode component |
| `frontend/src/components/game/whiteboard/WhiteboardModeRegistry.ts` | **Modify** — add `12: { name: "UPDATES", icon: "📢" }`, bump `WHITEBOARD_MODE_COUNT` to 13 |
| `frontend/src/types/index.ts` | **Modify** — add `| 12` to `WhiteboardMode` union |
| `frontend/src/stores/gameStore.ts` | **Modify** — update `WHITEBOARD_MODE_COUNT` to 13 (currently 11, should be 13 to cover 0-12) |
| `frontend/src/components/game/Whiteboard.tsx` | **Modify** — add `case 12:` in `renderMode()`, add `U` hotkey in `handleKeyDown`, update mode indicator dots from 12 to 13 |

**Behavior:**
- Renders as list inside whiteboard content area (like KanbanMode)
- Each item: priority-colored dot + title text (truncated to fit 310px)
- Shows up to 6 items (content area ~155px tall)
- Fetches floor updates when mode becomes active; uses `floorId` from navigation store

---

## F4 — CLevelView Básico

**What:** React component (NOT PixiJS) replacing `FloorView` when current floor has `isCLevel: true`. Two columns.

**Files:**
| File | Action |
|------|--------|
| `frontend/src/types/navigation.ts` | **Modify** — add `isCLevel?: boolean` and `mission?: string` to `FloorConfig` |
| `frontend/src/components/views/CLevelView.tsx` | **Create** — two-column dashboard |
| `frontend/src/app/page.tsx` | **Modify** — conditionally render `CLevelView` vs `FloorView` based on current floor's `isCLevel` |

**Left column — Floor Status Cards:**
- One card per non-C-Level floor (from `buildingConfig.floors.filter(f => !f.isCLevel)`)
- Card: floor icon, name (accent-colored), LED dot colored by latest update priority
- LED colors: green=info/no-updates, orange=alert, red=critical, blue=report
- Fetch latest update per floor: `GET /api/v1/floors/{floor_id}/updates?limit=1`

**Right column — C-Level Chat:**
- Reuses `ChatTab` component with `floorId="c_level"`
- Full height, fills right side

**How CLevelView replaces FloorView:**
- In `page.tsx`, check `useNavigationStore` for current `floorId`, look up floor in `buildingConfig`
- If `floor.isCLevel === true`, render `<CLevelView />` instead of `<FloorView />`
- The backend already sends `is_c_level` (serialized as `isCLevel` via camelCase alias) from `floors.toml`; the frontend `FloorConfig` type just needs to accept it

---

## Types — `frontend/src/types/prometeo.ts`

```typescript
export interface ChatMessage {
  id: number;
  floorId: string;
  sender: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string; // ISO 8601
}

export interface FloorUpdate {
  id: number;
  floorId: string;
  priority: "critical" | "alert" | "info" | "report";
  title: string;
  body: string;
  timestamp: string; // ISO 8601
  autoExpireHours: number;
  resolved: boolean;
}

export const PRIORITY_COLORS: Record<FloorUpdate["priority"], string> = {
  critical: "#ef4444",
  alert: "#f59e0b",
  info: "#22c55e",
  report: "#3b82f6",
};
```

---

## Success Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| S1 | TypeScript compiles | `cd frontend && npx tsc --noEmit` exits 0 |
| S2 | Build succeeds | `cd frontend && npm run build` exits 0 |
| S3 | No existing test regressions | `cd frontend && npx vitest run` exits 0 (if tests exist) |
| S4 | Chat tab renders | Navigate to floor → click Chat tab → message list + input visible |
| S5 | Updates bar visible | Building view shows bar at bottom with updates |
| S6 | Whiteboard mode 12 | Press `U` → UPDATES mode shown with floor updates |
| S7 | CLevelView renders | Click C-Level floor → two-column dashboard (no PixiJS) |
| S8 | Lint passes | `cd frontend && npm run lint` exits 0 |

## Non-Functional

- No backend modifications
- No new npm dependencies
- Base URL: `http://localhost:8000/api/v1` (match `useFloorConfig.ts` pattern)
- WS URL: `ws://localhost:8000/ws/floor/{floor_id}` (match backend endpoint)
- Follow existing patterns: Tailwind classes, Zustand stores, `"use client"` directives
