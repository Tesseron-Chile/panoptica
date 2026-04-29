# PLAN — Run A-3: Frontend (Chat + Updates + CLevelView)

## Execution Order

```
T0 (types) → T1 (chat) → T2 (updates bar) → T3 (whiteboard mode 12) → T4 (CLevelView) → T5 (verify)
```

T1 before T4 (CLevelView reuses ChatTab). T2 and T3 independent but both need T0.

---

### T0 — Shared Types + FloorConfig Extension ✅

**Create** `frontend/src/types/prometeo.ts`:
```typescript
export interface ChatMessage {
  id: number;
  floorId: string;
  sender: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string;
}

export interface FloorUpdate {
  id: number;
  floorId: string;
  priority: "critical" | "alert" | "info" | "report";
  title: string;
  body: string;
  timestamp: string;
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

**Modify** `frontend/src/types/navigation.ts` — add to `FloorConfig`:
```typescript
isCLevel?: boolean;
mission?: string;
```

**Verify:** `cd frontend && npx tsc --noEmit`

---

### T1 — Chat Tab + RightSidebar Integration ✅

**Create `frontend/src/hooks/useFloorChat.ts`:**
- Params: `floorId: string | null`
- State: `messages: ChatMessage[]`, `loading: boolean`, `sending: boolean`
- `fetchMessages(floorId)`: `GET /api/v1/floors/{floorId}/chat?limit=50` → reverse array (API returns newest-first)
- `sendMessage(content)`: `POST /api/v1/floors/{floorId}/chat` body `{sender:"user", role:"user", content}`
- WS: `ws://localhost:8000/ws/floor/{floorId}`, on `{type:"chat_message", message}` → append to messages
- Re-connect WS when floorId changes; cleanup on unmount
- Follow `useWebSocketEvents.ts` pattern: `useRef<WebSocket>`, connection ID ref for stale-handler prevention

**Create `frontend/src/components/chat/ChatTab.tsx`:**
- Props: `floorId?: string` — defaults to `useNavigationStore().floorId`
- Uses `useFloorChat(effectiveFloorId)`
- Message list: scrollable `overflow-y-auto`, auto-scroll via ref + `scrollIntoView`
- Bubbles: user→right `bg-violet-600/20`, agent/system→left `bg-slate-700/50`
- Input at bottom: Enter sends, disabled while `sending`, clear on success
- No floorId: "Select a floor to start chatting" placeholder

**Modify `frontend/src/components/layout/RightSidebar.tsx`:**
- Extend `activeTab` union: `"events" | "conversation" | "chat"`
- Add third tab button: `text-violet-400 border-violet-500` when active
- Render `<ChatTab />` when `activeTab === "chat"`

**Key patterns:**
- Base URL: `http://localhost:8000/api/v1` (hardcoded, consistent with `useFloorConfig.ts`)
- WS `/ws/floor/{floor_id}` is read-only from client. Chat posts go via REST, not WS.

**Verify:** `npx tsc --noEmit` — Chat tab appears on floor view

---

### T2 — Updates Bar in BuildingView ✅

**Create `frontend/src/hooks/useLatestUpdates.ts`:**
- State: `updates: FloorUpdate[]`, `loading: boolean`
- Fetch on mount: `GET /api/v1/updates/latest?limit=3`
- Poll every 30s via `setInterval`; cleanup on unmount

**Create `frontend/src/components/updates/UpdatesBar.tsx`:**
- Uses `useLatestUpdates()` hook
- Horizontal flex bar: `bg-slate-900/80 border-slate-700 rounded-lg`
- Each update: colored dot (`PRIORITY_COLORS`) + floor icon (from `buildingConfig`) + title + relative time
- Click → `goToFloor(update.floorId)`
- Empty: return `null` (hide bar)

**Modify `frontend/src/components/views/BuildingView.tsx`:**
- Import + render `<UpdatesBar />` after foundation div, inside the `max-w-2xl` container with `mt-4`

**Verify:** `npx tsc --noEmit` — bar visible in BuildingView when updates exist

---

### T3 — Whiteboard Mode 12 (Updates Board) ✅

**Modify `frontend/src/types/index.ts`:**
- Add `| 12` to `WhiteboardMode` union

**Modify `frontend/src/stores/gameStore.ts`:**
- Change `WHITEBOARD_MODE_COUNT` from `11` to `13` (line ~297)
- Note: gameStore=11 and registry=12 are inconsistent. Both should be 13 (modes 0-12).

**Modify `frontend/src/components/game/whiteboard/WhiteboardModeRegistry.ts`:**
- Add `12: { name: "UPDATES", icon: "📢" }` to `MODE_INFO`
- Change `WHITEBOARD_MODE_COUNT` from `12` to `13`

**Create `frontend/src/components/game/whiteboard/UpdatesMode.tsx`:**
- PixiJS component, follows KanbanMode pattern (`pixiContainer`, `pixiText`, `pixiGraphics`)
- Props: `floorId: string | null`
- `useState` + `useEffect` to fetch `GET /api/v1/floors/{floorId}/updates` on mount/change
- List: up to 6 items, each ~25px tall, 310px wide
- Each item: priority-colored rect + title via `pixiText`
- No floorId or empty: "No updates" text

**Modify `frontend/src/components/game/Whiteboard.tsx`:**
- Import `UpdatesMode`
- Get `floorId` from `useNavigationStore`
- `case 12: return <UpdatesMode floorId={floorId} />;`
- Keyboard: `case "u": setMode(12); break;`
- Dots: `Array.from({ length: 13 })` (was 12)

**Verify:** `npx tsc --noEmit` — press `U` for UPDATES mode

---

### T4 — CLevelView Básico ✅

**Create `frontend/src/components/views/CLevelView.tsx`:**
- Two-column: `grid grid-cols-1 md:grid-cols-2 gap-4 h-full p-6`
- **Left: Floor Status Cards**
  - Header: "Floor Status" purple accent
  - For each floor where `!f.isCLevel`: render card
  - Card: `bg-slate-800 border-slate-700 rounded-lg p-4` + accent strip
  - LED dot: fetch `GET /api/v1/floors/{floor_id}/updates?limit=1` per floor on mount
  - LED colors: critical=red, alert=orange, info=green, report=blue, none=gray(`#6b7280`)
  - Latest update title as subtitle
  - Click → `goToFloor(floor.id)`
- **Right: C-Level Chat**
  - Header: "C-Level Chat" purple
  - `<ChatTab floorId="c_level" />` full height

**Modify `frontend/src/app/page.tsx`:**
- Import `CLevelView`
- Get `floorId` and `buildingConfig` from `useNavigationStore`
- Compute: `const currentFloor = buildingConfig?.floors.find(f => f.id === floorId)`
- In `ViewTransition` `floorView` prop:
  ```tsx
  floorView={
    currentFloor?.isCLevel
      ? <CLevelView />
      : <FloorView sessions={...} ... />
  }
  ```
- This works: ViewTransition toggles floorView via CSS display. When CLevelView replaces FloorView in the prop, only CLevelView renders—no PixiJS duplication issue.

**Verify:** `npx tsc --noEmit` + `npm run build` — C-Level shows dashboard, not PixiJS

---

### T5 — Final Verification ✅

```bash
cd frontend && npx tsc --noEmit
cd frontend && npm run build
cd frontend && npm run lint
```

Fix any issues. All commands must exit 0.
