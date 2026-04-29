# PLAN — Run A-3: Frontend (Chat + Updates + CLevelView)

## Task Breakdown

### T1 — Types + Hooks foundation
**✅ Status: complete**

Create shared types and data-fetching hooks used by all features.

**Files to create:**
- `frontend/src/types/prometeo.ts` — `ChatMessage`, `FloorUpdate` interfaces
- `frontend/src/hooks/useFloorChat.ts` — fetch chat history, send message, WS subscription for `chat_message` events
- `frontend/src/hooks/useFloorUpdates.ts` — fetch updates with polling, support floor-specific and cross-floor queries

**Files to modify:**
- `frontend/src/types/index.ts` — re-export from `prometeo.ts`

**Key patterns to follow:**
- WebSocket: see `useWebSocketEvents.ts` for connection/reconnection pattern. The new floor WS (`ws://localhost:8000/ws/floor/{floorId}`) is a separate connection
- API calls: plain `fetch("http://localhost:8000/api/v1/...")` — no axios, no env var for base URL (hardcoded pattern in codebase)
- State: React `useState` + `useEffect` for hook-local state (not Zustand, since these are component-scoped data)

**Verify:** `npx tsc --noEmit` passes

---

### T2 — Chat Tab + RightSidebar integration
**⬜ Status: pending**

**Files to create:**
- `frontend/src/components/game/ChatTab.tsx` — message list with bubbles + input field

**Files to modify:**
- `frontend/src/components/layout/RightSidebar.tsx` — extend tab type to `"events" | "conversation" | "chat"`, add third tab button, render `<ChatTab />` when active

**Implementation notes:**
- Current tab state: `useState<"events" | "conversation">("events")` at line ~73 of RightSidebar
- Tab buttons: lines ~97-116 render two buttons with accent colors (orange for events, cyan for conversation)
- Add Chat tab with accent purple (`#a78bfa` / violet-400)
- `ChatTab` receives `floorId` from `useNavigationStore().floorId`; if null (building view), show "Select a floor" placeholder
- Uses `useFloorChat(floorId)` hook from T1
- Message bubbles: user messages right-aligned with `bg-violet-600/20`, agent messages left with `bg-slate-700/50`
- Input: simple `<input>` with Enter-to-send, disabled state while posting

**Verify:** `npx tsc --noEmit` + manual: open floor, click Chat tab, see UI

---

### T3 — Updates Bar in BuildingView
**⬜ Status: pending**

**Files to create:**
- `frontend/src/components/game/UpdatesBar.tsx` — horizontal bar with up to 3 update cards

**Files to modify:**
- `frontend/src/components/views/BuildingView.tsx` — import and render `<UpdatesBar />` below the floor list

**Implementation notes:**
- BuildingView layout: currently renders roof → floors map → lobby → foundation inside a scrollable container
- Add `<UpdatesBar />` as a fixed/sticky element at the bottom, outside the scroll area
- Uses `useFloorUpdates()` hook from T1 (cross-floor, limit=3)
- Each card: left border colored by priority, floor icon (lookup from `buildingConfig`), title, `date-fns` `formatDistanceToNow` for relative time
- Empty state: muted "No recent updates" text

**Verify:** `npx tsc --noEmit` + manual: go to building view, see bar at bottom

---

### T4 — Whiteboard Mode 12 (Updates Board)
**⬜ Status: pending**

**Files to create:**
- `frontend/src/components/game/whiteboard/UpdatesBoardMode.tsx` — scrollable update list for whiteboard area

**Files to modify:**
- `frontend/src/types/index.ts` — add `| 12` to `WhiteboardMode` union
- `frontend/src/components/game/whiteboard/WhiteboardModeRegistry.ts` — add mode 12 entry, bump `WHITEBOARD_MODE_COUNT` to 13
- `frontend/src/components/game/Whiteboard.tsx` — add `case 12:` in `renderMode()` switch, add `U` key handler in keydown listener

**Implementation notes:**
- Existing mode pattern: each mode is a component rendered in the whiteboard container (~200x150 area)
- `UpdatesBoardMode` uses `useFloorUpdates(floorId, { limit: 10 })` to fetch updates for active floor
- Renders scrollable list: priority dot (colored circle) + title + truncated body + relative timestamp
- Follow visual style of existing modes (dark bg, monospace-ish text, compact layout)

**Verify:** `npx tsc --noEmit` + manual: press `U`, see Updates mode on whiteboard

---

### T5 — CLevelView
**⬜ Status: pending**

**Files to create:**
- `frontend/src/components/views/CLevelView.tsx` — two-column layout replacing FloorView for c_level floor

**Files to modify:**
- `frontend/src/app/page.tsx` — conditionally render `CLevelView` vs `FloorView` based on `floorId`
- `frontend/src/components/navigation/ViewTransition.tsx` — may need to accept a third view option or handle inline

**Implementation notes:**
- Injection: In `page.tsx` (line ~470), `ViewTransition` receives `floorView` prop. Check `floorId === "c_level"` from `useNavigationStore` and pass `<CLevelView />` instead of `<FloorView ...props />`
- `ViewTransition` note: FloorView is "always mounted, toggled via CSS" to avoid PixiJS duplication. CLevelView has no PixiJS so it can be conditionally rendered normally. Need to handle this carefully — when `floorId === "c_level"`, hide FloorView and show CLevelView.
- Left column: iterate `buildingConfig.floors.filter(f => f.id !== "c_level")`, render a status card per floor
  - LED dot: fetch latest update per floor via `useFloorUpdates`, map priority → color (critical=red, alert=orange, info/report=green, none=gray)
  - Card shows: floor accent color strip, icon, name, latest update title
- Right column: `<ChatTab floorId="c_level" />` (reuse from T2) — render full-height, not inside sidebar
- Responsive: `grid grid-cols-1 md:grid-cols-2` or flexbox with wrap
- Style: dark theme matching existing app (`bg-slate-900`, `border-slate-700`)

**Verify:** `npx tsc --noEmit` + `npm run build` + manual: click C-Level floor, see two-column view

---

### T6 — Final verification
**⬜ Status: pending**

Run full check suite and fix any issues.

- `cd frontend && npx tsc --noEmit`
- `cd frontend && npm run build`
- `cd frontend && npx vitest run`
- `cd frontend && npm run lint`

**Verify:** All four commands exit 0.
