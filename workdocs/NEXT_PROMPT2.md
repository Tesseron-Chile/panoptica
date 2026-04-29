# Ralph Coder Prompt — Run A-3, Task T1: Types + Hooks

You are the **coder agent** (🔨) in the Ralph workflow (Phase B, Task T1).

## Context

Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
Feature branch: `ralph/1f8d21f2` (already on this branch)
This is a **frontend-only** task. Do NOT modify backend files.

Read `workdocs/SPEC.md`, `workdocs/PLAN.md`, and `workdocs/SETUP.md` before starting.

## Your task: Types + Hooks foundation (T1)

Create the shared TypeScript types and data-fetching hooks used by all frontend features in Run A-3.

### Files to create

**`frontend/src/types/prometeo.ts`**

```typescript
export interface ChatMessage {
  id: number;
  floorId: string;
  sender: string;
  role: string;
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
```

**`frontend/src/hooks/useFloorChat.ts`**

Hook that:
- Fetches `GET http://localhost:8000/api/v1/floors/{floorId}/chat?limit=50` on mount and when `floorId` changes
- Exposes `sendMessage(content: string)` — calls `POST /api/v1/floors/{floorId}/chat` with `{sender: "user", role: "user", content}`
- Opens WS `ws://localhost:8000/ws/floor/{floorId}` and on `{type: "chat_message"}` events appends the message payload to the list
- Closes WS on floorId change or unmount
- Returns `{ messages: ChatMessage[], sendMessage, isLoading, error }`
- If `floorId` is null, returns empty state without fetching

**`frontend/src/hooks/useFloorUpdates.ts`**

Hook that:
- Accepts `{ floorId?: string | null, limit?: number }` — if `floorId` provided, calls `GET /api/v1/floors/{floorId}/updates`; otherwise calls `GET /api/v1/updates/latest?limit={limit ?? 10}`
- Polls every 30 seconds via `setInterval`
- Returns `{ updates: FloorUpdate[], isLoading, error, refresh }`
- Cleans up interval on unmount

### Files to modify

**`frontend/src/types/index.ts`** — add at the end (before any closing export if present):
```typescript
export type { ChatMessage, FloorUpdate } from "./prometeo";
```

Also add `| 12` to the `WhiteboardMode` type union (currently ends at `| 11`).

**`frontend/src/types/navigation.ts`** — add `is_c_level?: boolean` to `FloorConfig`:
```typescript
export interface FloorConfig {
  id: string;
  name: string;
  floor_number: number;
  accent: string;
  icon: string;
  is_c_level?: boolean;
  rooms: RoomConfig[];
}
```

### Verify

```bash
cd frontend && npx tsc --noEmit
```

Must exit 0 with no errors. Fix any TypeScript errors before committing.

### Commit

```bash
git add frontend/src/types/prometeo.ts frontend/src/hooks/useFloorChat.ts frontend/src/hooks/useFloorUpdates.ts frontend/src/types/index.ts frontend/src/types/navigation.ts workdocs/PLAN.md workdocs/STATS.md
git commit -m "feat(frontend): A-3 T1 — types + hooks (ChatMessage, FloorUpdate, useFloorChat, useFloorUpdates)"
git push origin ralph/1f8d21f2
```

Update `workdocs/PLAN.md` to mark T1 as ✅ before committing.

### Critical notes

- Do NOT run `npm install` — deps are installed
- Do NOT modify backend files
- Ignore all files with " 2" in their name (macOS Finder duplicates)
- API base: `http://localhost:8000/api/v1` (hardcoded — no env var)
- WS base: `ws://localhost:8000` (hardcoded)
- Exit after pushing
