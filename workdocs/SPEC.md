# SPEC — Run A-3: Frontend (Chat + Updates + CLevelView)

## Scope

Four frontend features on top of existing backend APIs from Run A-2.

---

## F1 — Chat Tab in RightSidebar

**What:** New "Chat" tab in `RightSidebar` (alongside Events and Conversation). Shows chat history for the active floor with message bubbles (user vs agent) and an input field to send messages.

**API integration:**
- `GET http://localhost:8000/api/v1/floors/{floorId}/chat?limit=50` — load history
- `POST http://localhost:8000/api/v1/floors/{floorId}/chat` — send `{sender: "user", role: "human", content}`
- WS `ws://localhost:8000/ws/floor/{floorId}` — listen for `{type: "chat_message", ...}` to append in real time

**Component breakdown:**
| Component | File | Action |
|-----------|------|--------|
| `ChatTab` | `frontend/src/components/game/ChatTab.tsx` | New — message list + input |
| `RightSidebar` | `frontend/src/components/layout/RightSidebar.tsx` | Modify — add third tab |
| Tab type | `frontend/src/components/layout/RightSidebar.tsx` | Extend union `"events" \| "conversation" \| "chat"` |
| Types | `frontend/src/types/prometeo.ts` | New — `ChatMessage`, `FloorUpdate` interfaces |
| Hook | `frontend/src/hooks/useFloorChat.ts` | New — fetch history, send, WS subscription |

**Behavior:**
- Tab shows floor icon + "Chat" label
- On tab switch or floor change: fetch latest 50 messages
- WS messages of type `chat_message` append to list in real time
- Input field at bottom; Enter sends; disable while sending
- User bubbles right-aligned (purple), agent bubbles left-aligned (slate)
- Auto-scroll to bottom on new message
- `floorId` comes from `useNavigationStore().floorId`

---

## F2 — Updates Bar in BuildingView

**What:** Fixed strip at the bottom of `BuildingView` showing the top 3 most recent/urgent updates across all floors.

**API integration:**
- `GET http://localhost:8000/api/v1/updates/latest?limit=3` — polled every 30s

**Component breakdown:**
| Component | File | Action |
|-----------|------|--------|
| `UpdatesBar` | `frontend/src/components/game/UpdatesBar.tsx` | New |
| `BuildingView` | `frontend/src/components/views/BuildingView.tsx` | Modify — render `<UpdatesBar />` at bottom |
| Hook | `frontend/src/hooks/useFloorUpdates.ts` | New — fetch + poll updates |

**Behavior:**
- Horizontal bar, dark background, full width at bottom of BuildingView
- Each update card: colored left border by priority, floor icon, title, relative timestamp
- Priority colors: critical=`#ef4444`, alert=`#f59e0b`, info=`#22c55e`, report=`#3b82f6`
- Empty state: subtle "No updates" text
- Poll every 30s via `setInterval` + `fetch`

---

## F3 — Whiteboard Mode 12 (Updates Board)

**What:** New whiteboard mode "UPDATES" (index 12, shortcut `U`) showing floor updates list.

**Component breakdown:**
| Component | File | Action |
|-----------|------|--------|
| `UpdatesBoardMode` | `frontend/src/components/game/whiteboard/UpdatesBoardMode.tsx` | New |
| `WhiteboardModeRegistry` | `frontend/src/components/game/whiteboard/WhiteboardModeRegistry.ts` | Modify — add mode 12 |
| `WhiteboardMode` type | `frontend/src/types/index.ts` | Modify — add `\| 12` to union |
| `Whiteboard` | `frontend/src/components/game/Whiteboard.tsx` | Modify — add case 12 + `U` hotkey |

**Behavior:**
- Fetches updates for current floor via `GET /api/v1/updates/latest?limit=10`
- Renders as scrollable list inside whiteboard area
- Each item: priority dot + title + body preview + timestamp
- Color-coded by priority (same palette as F2)

---

## F4 — CLevelView (Minimal)

**What:** New React component that replaces `FloorView` when `floorId === "c_level"`. Two-column layout (no PixiJS). Left: floor status cards with LED indicators. Right: C-Level chat (reuses `ChatTab`).

**Component breakdown:**
| Component | File | Action |
|-----------|------|--------|
| `CLevelView` | `frontend/src/components/views/CLevelView.tsx` | New |
| `FloorStatusCard` | `frontend/src/components/views/CLevelView.tsx` | Inline in same file |
| `page.tsx` | `frontend/src/app/page.tsx` | Modify — conditionally render CLevelView vs FloorView |
| `ViewTransition` | `frontend/src/components/navigation/ViewTransition.tsx` | Modify — accept `cLevelView` prop or handle inline |
| Hook | `frontend/src/hooks/useFloorUpdates.ts` | Reuse from F2 |

**Behavior:**
- Left column: one card per department floor (from `buildingConfig.floors`, excluding c_level)
  - Card shows: floor icon, name, LED dot colored by latest update priority (green=ok/info, orange=alert, red=critical, gray=no updates)
  - Latest update title as subtitle
- Right column: `ChatTab` component with `floorId="c_level"`
- Responsive: stack columns on narrow viewport
- No Architect column (deferred to Run C-2)

**Injection point:** In `page.tsx`, the `ViewTransition` receives `floorView` prop. We check `floorId === "c_level"` and pass `CLevelView` instead of `FloorView`.

---

## Types (new file: `frontend/src/types/prometeo.ts`)

```typescript
export interface ChatMessage {
  id: string;
  floorId: string;
  sender: string;
  role: string;
  content: string;
  timestamp: string;
}

export interface FloorUpdate {
  id: string;
  floorId: string;
  priority: "critical" | "alert" | "info" | "report";
  title: string;
  body: string;
  timestamp: string;
  autoExpireHours: number;
  resolved: boolean;
}
```

---

## Success Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| S1 | TypeScript compiles cleanly | `cd frontend && npx tsc --noEmit` exits 0 |
| S2 | Production build succeeds | `cd frontend && npm run build` exits 0 |
| S3 | No regressions in existing smoke test | `cd frontend && npx vitest run` exits 0 |
| S4 | Chat tab renders in RightSidebar | Manual: navigate to floor, click Chat tab, see message list + input |
| S5 | Updates bar visible in BuildingView | Manual: navigate to building view, see bar at bottom |
| S6 | Whiteboard mode 12 accessible | Manual: press U on keyboard, see Updates mode |
| S7 | CLevelView renders for c_level floor | Manual: click C-Level floor, see two-column view instead of PixiJS office |
| S8 | ESLint passes | `cd frontend && npm run lint` exits 0 |

## Non-Functional

- No backend file modifications
- No new npm dependencies (use native `fetch`, `WebSocket`, existing Zustand/React)
- Follow existing patterns: Zustand stores, Tailwind utility classes, `http://localhost:8000/api/v1` base URL
