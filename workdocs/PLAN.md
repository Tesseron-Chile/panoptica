# Team Office Merge — Implementation Plan

> **For agentic workers:** This plan executes via Ralph workflow. Steps use checkbox (`- [ ]`) syntax for tracking. Each task is sized for a single focused coder session.

**Goal:** Collapse Panoptica's three-tier navigation (Campus → RunOfficeView → NookDrillDown) into two tiers by merging the 4 isolated role nooks and the per-role drill-down into a single unified **TeamOffice** view where all role sessions are co-located in one PixiJS canvas. Campus gains mini-office previews per run.

**Architecture:** `RunOfficeView` becomes the team office — a single `<OfficeGame />` canvas hydrated from `run.memberSessionIds` via a new `useRunAgentHydration` hook that maps roles to stable desk assignments (designer=1, coder=2, verifier=3, reviewer=4) and the orchestrator to the boss sprite. Empty role slots render as empty desks. Plan tasks flow into the in-canvas `<Whiteboard>` sprite. A lean DOM sidebar surfaces repo/branch/phase/elapsed. Click-to-focus uses the existing `CharacterFocusPopup`, extended with role/model/task fields pulled from `runStore` + `sessionsStore`. `NookDrillDown`, `NookSidebar`, `RoleNook`, and related navigation state are deleted.

**Tech Stack:** Next.js App Router, TypeScript, Zustand (runStore/sessionsStore/gameStore/navigationStore), `@pixi/react` v8, PixiJS v8, TailwindCSS.

---

## File Structure

**Create:**
- `frontend/src/hooks/useRunAgentHydration.ts` — effect hook that diffs run members → gameStore agents + boss
- `frontend/src/lib/roleDesks.ts` — role→desk and role→visual (color/number) mapping
- `frontend/src/components/office/OfficeSidebar.tsx` — run metadata panel (repo, phase, elapsed, orchestrator log tail)
- `frontend/src/components/campus/RunMiniOffice.tsx` — pure CSS/SVG preview for Campus cards

**Modify:**
- `frontend/src/components/views/RunOfficeView.tsx` — replace 4-nook grid with `<OfficeGame />` + `<OfficeSidebar />`
- `frontend/src/components/views/CampusView.tsx` — swap card body for `<RunMiniOffice />`
- `frontend/src/components/game/CharacterFocusPopup.tsx` — add role/model/task rows (lookup by sessionId)
- `frontend/src/components/game/Whiteboard.tsx` — accept `planTasks` alongside existing todos (or replace todos with planTasks)
- `frontend/src/stores/navigationStore.ts` — remove `activeNookSessionId`, `goToNookDrillDown`, `drilldown` view
- `frontend/src/lib/runRoles.ts` — move visual map (color/number) here or into `roleDesks.ts` (consolidate)

**Delete:**
- `frontend/src/components/views/NookDrillDown.tsx`
- `frontend/src/components/office/NookSidebar.tsx`
- `frontend/src/components/office/RoleNook.tsx` (if unused after RunOfficeView rewrite)

---

## Task 1: ✅ Role→desk & visuals module

**Files:**
- Create: `frontend/src/lib/roleDesks.ts`
- Test: `frontend/src/lib/__tests__/roleDesks.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { roleToDesk, roleToVisual, ROLE_KEYS } from "@/lib/roleDesks";

describe("roleDesks", () => {
  it("assigns stable desk indexes per role", () => {
    expect(roleToDesk("designer")).toBe(1);
    expect(roleToDesk("coder")).toBe(2);
    expect(roleToDesk("verifier")).toBe(3);
    expect(roleToDesk("reviewer")).toBe(4);
  });

  it("returns null for unknown role", () => {
    expect(roleToDesk(null)).toBeNull();
    expect(roleToDesk("orchestrator")).toBeNull();
  });

  it("exposes hex color and number per role", () => {
    expect(roleToVisual("designer")).toEqual({ color: "#a855f7", number: 1 });
    expect(roleToVisual("coder")).toEqual({ color: "#3b82f6", number: 2 });
  });

  it("exports the canonical role key ordering", () => {
    expect(ROLE_KEYS).toEqual(["designer", "coder", "verifier", "reviewer"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && bun test src/lib/__tests__/roleDesks.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the module**

```typescript
// frontend/src/lib/roleDesks.ts
import type { RoleKey } from "@/lib/runRoles";

export const ROLE_KEYS: RoleKey[] = ["designer", "coder", "verifier", "reviewer"];

const DESK_BY_ROLE: Record<RoleKey, number> = {
  designer: 1,
  coder: 2,
  verifier: 3,
  reviewer: 4,
};

const VISUAL_BY_ROLE: Record<RoleKey, { color: string; number: number }> = {
  designer: { color: "#a855f7", number: 1 },
  coder: { color: "#3b82f6", number: 2 },
  verifier: { color: "#10b981", number: 3 },
  reviewer: { color: "#f59e0b", number: 4 },
};

export function roleToDesk(role: string | null): number | null {
  if (!role) return null;
  const key = role === "coder-continuation" ? "coder" : role;
  return (DESK_BY_ROLE as Record<string, number>)[key] ?? null;
}

export function roleToVisual(role: string | null) {
  if (!role) return null;
  const key = role === "coder-continuation" ? "coder" : role;
  return (VISUAL_BY_ROLE as Record<string, { color: string; number: number }>)[key] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && bun test src/lib/__tests__/roleDesks.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/roleDesks.ts frontend/src/lib/__tests__/roleDesks.test.ts
git commit -m "Add roleDesks lib: stable desk + visual mapping per role"
```

---

## Task 2: ✅ useRunAgentHydration hook

**Files:**
- Create: `frontend/src/hooks/useRunAgentHydration.ts`
- Test: `frontend/src/hooks/__tests__/useRunAgentHydration.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRunAgentHydration } from "@/hooks/useRunAgentHydration";
import { useGameStore } from "@/stores/gameStore";

function makeRun(memberSessionIds: string[], orchestratorId: string | null = null) {
  return {
    runId: "run-1",
    memberSessionIds,
    orchestratorSessionId: orchestratorId,
  };
}
function makeSessions(entries: Array<{ id: string; role: string | null }>) {
  return new Map(entries.map((e) => [e.id, { id: e.id, role: e.role } as any]));
}

beforeEach(() => {
  useGameStore.setState({ agents: new Map() });
});

describe("useRunAgentHydration", () => {
  it("adds one agent per member session with role", () => {
    const run = makeRun(["s1", "s2"]);
    const sessions = makeSessions([
      { id: "s1", role: "designer" },
      { id: "s2", role: "coder" },
    ]);
    renderHook(() => useRunAgentHydration(run as any, sessions));
    const agents = useGameStore.getState().agents;
    expect(agents.size).toBe(2);
    expect(agents.get("s1")?.color).toBe("#a855f7");
    expect(agents.get("s2")?.color).toBe("#3b82f6");
  });

  it("does not add agents for the orchestrator session", () => {
    const run = makeRun(["s1", "s2"], "s2");
    const sessions = makeSessions([
      { id: "s1", role: "designer" },
      { id: "s2", role: null },
    ]);
    renderHook(() => useRunAgentHydration(run as any, sessions));
    expect(useGameStore.getState().agents.has("s2")).toBe(false);
  });

  it("removes agents when members leave", () => {
    const sessions = makeSessions([
      { id: "s1", role: "designer" },
      { id: "s2", role: "coder" },
    ]);
    const { rerender } = renderHook(
      ({ run }: { run: any }) => useRunAgentHydration(run, sessions),
      { initialProps: { run: makeRun(["s1", "s2"]) } },
    );
    expect(useGameStore.getState().agents.size).toBe(2);
    rerender({ run: makeRun(["s1"]) });
    expect(useGameStore.getState().agents.size).toBe(1);
    expect(useGameStore.getState().agents.has("s2")).toBe(false);
  });

  it("clears all agents on unmount", () => {
    const run = makeRun(["s1", "s2"]);
    const sessions = makeSessions([
      { id: "s1", role: "designer" },
      { id: "s2", role: "coder" },
    ]);
    const { unmount } = renderHook(() => useRunAgentHydration(run as any, sessions));
    expect(useGameStore.getState().agents.size).toBe(2);
    unmount();
    expect(useGameStore.getState().agents.size).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && bun test src/hooks/__tests__/useRunAgentHydration.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the hook**

```typescript
// frontend/src/hooks/useRunAgentHydration.ts
import { useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { roleToDesk, roleToVisual } from "@/lib/roleDesks";
import type { Agent as BackendAgent, Run, Session } from "@/types/generated";

const DESK_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 220, y: 520 },
  2: { x: 460, y: 520 },
  3: { x: 700, y: 520 },
  4: { x: 940, y: 520 },
};

export function useRunAgentHydration(
  run: Run | null,
  sessionsById: Map<string, Session>,
): void {
  useEffect(() => {
    if (!run) return;

    const addAgent = useGameStore.getState().addAgent;
    const removeAgent = useGameStore.getState().removeAgent;

    const desired = new Set<string>();
    for (const sid of run.memberSessionIds) {
      if (sid === run.orchestratorSessionId) continue;
      const session = sessionsById.get(sid);
      if (!session) continue;
      const visual = roleToVisual(session.role ?? null);
      const desk = roleToDesk(session.role ?? null);
      if (!visual || !desk) continue;

      desired.add(sid);
      const existing = useGameStore.getState().agents.get(sid);
      if (existing) continue;

      const synthetic: BackendAgent = {
        id: sid,
        name: session.role ?? "agent",
        color: visual.color,
        number: visual.number,
        state: "idle",
        desk,
        currentTask: null,
        characterType: null,
        parentSessionId: null,
        parentId: null,
      };
      addAgent(synthetic, DESK_POSITIONS[desk] ?? { x: 640, y: 520 });
    }

    for (const id of useGameStore.getState().agents.keys()) {
      if (!desired.has(id)) removeAgent(id);
    }

    return () => {
      const agentIds = Array.from(useGameStore.getState().agents.keys());
      for (const id of agentIds) removeAgent(id);
    };
  }, [run, sessionsById]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && bun test src/hooks/__tests__/useRunAgentHydration.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useRunAgentHydration.ts frontend/src/hooks/__tests__/useRunAgentHydration.test.tsx
git commit -m "Add useRunAgentHydration hook: diff members to gameStore agents"
```

---

## Task 3: ✅ OfficeSidebar component

**Files:**
- Create: `frontend/src/components/office/OfficeSidebar.tsx`

- [ ] **Step 1: Implement the sidebar**

```tsx
// frontend/src/components/office/OfficeSidebar.tsx
"use client";
import type { Run } from "@/types/generated";

interface Props {
  run: Run | null;
  onBack: () => void;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const PHASE_CLASS: Record<string, string> = {
  A: "bg-blue-900 text-blue-200",
  B: "bg-violet-900 text-violet-200",
  C: "bg-amber-900 text-amber-200",
  D: "bg-emerald-900 text-emerald-200",
  done: "bg-slate-700 text-slate-200",
};

export function OfficeSidebar({ run, onBack }: Props): React.ReactNode {
  if (!run) {
    return (
      <aside className="w-64 bg-slate-900 border-l border-slate-800 p-4 text-slate-400 text-xs font-mono">
        no active run
      </aside>
    );
  }
  return (
    <aside className="w-64 bg-slate-900 border-l border-slate-800 p-4 text-xs font-mono flex flex-col gap-4">
      <button onClick={onBack} className="text-left text-slate-400 hover:text-white">← campus</button>
      <div>
        <div className="text-slate-500 uppercase tracking-widest text-[10px]">repo</div>
        <div className="text-slate-200 truncate">{run.primaryRepo}</div>
      </div>
      <div className="flex gap-2 items-center">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PHASE_CLASS[run.phase] ?? "bg-slate-700 text-slate-200"}`}>
          PHASE {run.phase.toUpperCase()}
        </span>
        <span className="text-slate-300">{formatElapsed(run.stats?.elapsedSeconds ?? 0)}</span>
      </div>
      <div>
        <div className="text-slate-500 uppercase tracking-widest text-[10px] mb-1">tasks</div>
        <div className="text-slate-200">
          {run.planTasks.filter((t) => t.status === "done").length} / {run.planTasks.length}
        </div>
      </div>
      <div className="mt-auto text-[10px] text-slate-600 leading-relaxed">
        Esc — back<br />
        Click agent — focus
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/office/OfficeSidebar.tsx
git commit -m "Add OfficeSidebar: run metadata panel for team office"
```

---

## Task 4: ✅ Wire TeamOffice into RunOfficeView

**Files:**
- Modify: `frontend/src/components/views/RunOfficeView.tsx`

- [ ] **Step 1: Replace the nook grid with OfficeGame + OfficeSidebar**

Replace the entire RunOfficeView body. Read the existing file first to preserve imports/back-navigation handlers.

```tsx
"use client";
import dynamic from "next/dynamic";
import { useNavigationStore } from "@/stores/navigationStore";
import { useRunStore } from "@/stores/runStore";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useRunAgentHydration } from "@/hooks/useRunAgentHydration";
import { OfficeSidebar } from "@/components/office/OfficeSidebar";

const OfficeGame = dynamic(
  () => import("@/components/game/OfficeGame").then((m) => ({ default: m.OfficeGame })),
  { ssr: false, loading: () => <div className="flex-1 bg-slate-950 animate-pulse" /> },
);

export function RunOfficeView(): React.ReactNode {
  const activeRunId = useNavigationStore((s) => s.activeRunId);
  const goToCampus = useNavigationStore((s) => s.goToCampus);
  const run = useRunStore((s) => (activeRunId ? (s.runs.get(activeRunId) ?? null) : null));
  const sessionsById = useSessionsStore((s) => s.sessionsById);

  useRunAgentHydration(run, sessionsById);

  return (
    <div className="flex flex-grow overflow-hidden min-h-0 w-full">
      <div className="flex-grow overflow-hidden relative min-h-0">
        <OfficeGame />
      </div>
      <OfficeSidebar run={run} onBack={goToCampus} />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && bunx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/views/RunOfficeView.tsx
git commit -m "RunOfficeView: render team office with agent hydration"
```

---

## Task 5: ✅ Pipe plan tasks into the Whiteboard sprite

**Files:**
- Modify: `frontend/src/components/game/Whiteboard.tsx`
- Modify: `frontend/src/components/game/OfficeGame.tsx`

- [ ] **Step 1: Read Whiteboard to understand todo format**

Run: `cat frontend/src/components/game/Whiteboard.tsx`

- [ ] **Step 2: Extend Whiteboard to accept plan tasks**

Add optional `planTasks?: PlanTask[]` prop; when present render status glyph + title (up to 6 tasks, truncate).

- [ ] **Step 3: Feed run.planTasks from OfficeGame**

Subscribe to active run via `useRunStore` and pass to `<Whiteboard planTasks={run?.planTasks} todos={todos} />`.

- [ ] **Step 4: Typecheck + visual verification**

Run: `cd frontend && bunx tsc --noEmit`
Open the app, navigate into a run, verify plan tasks render on the whiteboard.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/game/Whiteboard.tsx frontend/src/components/game/OfficeGame.tsx
git commit -m "Whiteboard: render run plan tasks with status glyphs"
```

---

## Task 6: ✅ Extend CharacterFocusPopup with role/model/task

**Files:**
- Modify: `frontend/src/components/game/CharacterFocusPopup.tsx`

- [ ] **Step 1: Read existing popup**

Run: `cat frontend/src/components/game/CharacterFocusPopup.tsx`

- [ ] **Step 2: Add role/model/task rows**

Look up session by `focusedCharacter.sessionId` in `useSessionsStore`, role via `session.role`, model via `run.modelConfig[role]`, task via `run.planTasks.find(t => t.assignedSessionId === sessionId)`.

- [ ] **Step 3: Typecheck**

Run: `cd frontend && bunx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/game/CharacterFocusPopup.tsx
git commit -m "CharacterFocusPopup: add role/model/task fields"
```

---

## Task 7: ✅ Delete NookDrillDown and related nook UI

**Files:**
- Delete: `frontend/src/components/views/NookDrillDown.tsx`
- Delete: `frontend/src/components/office/NookSidebar.tsx`
- Delete: `frontend/src/components/office/RoleNook.tsx` (if no other consumer)
- Modify: `frontend/src/stores/navigationStore.ts`

- [ ] **Step 1: Grep for nook references**

Run: `cd frontend && grep -rn "NookDrillDown\|NookSidebar\|RoleNook\|activeNookSessionId\|goToNookDrillDown\|drilldown" src/`

- [ ] **Step 2: Remove from navigationStore**

Drop `activeNookSessionId` state, `goToNookDrillDown` action, and `drilldown` view union variant.

- [ ] **Step 3: Remove consumers**

Update any component that reads `activeNookSessionId` or branches on `view === "drilldown"`. The router/view switcher collapses to campus / run-office.

- [ ] **Step 4: Delete files**

```bash
git rm frontend/src/components/views/NookDrillDown.tsx
git rm frontend/src/components/office/NookSidebar.tsx
git rm frontend/src/components/office/RoleNook.tsx   # if unreferenced
```

- [ ] **Step 5: Typecheck + run tests**

Run: `cd frontend && bunx tsc --noEmit && bun test`
Expected: no errors, all tests pass

- [ ] **Step 6: Commit**

```bash
git add -A frontend/
git commit -m "Remove NookDrillDown: team office replaces per-role drill-down"
```

---

## Task 8: ⬜ Campus mini office previews

**Files:**
- Create: `frontend/src/components/campus/RunMiniOffice.tsx`
- Modify: `frontend/src/components/views/CampusView.tsx`

- [ ] **Step 1: Implement RunMiniOffice (pure CSS)**

Pseudocode: card-shaped div, CSS `::before` for floor tiles + wall, 4 desks with role-colored dots (or gray if unfilled), tiny progress bar, phase-colored wall tint. Reference the mockup at `/tmp/panoptica-mockups.html` (see `.run-card` + desk layout). Aim for ~120px × 80px preview.

- [ ] **Step 2: Replace CampusView card body**

Swap the current card inner markup for `<RunMiniOffice run={run} />`. Keep the card click handler → `goToRunOffice(run.runId)`.

- [ ] **Step 3: Typecheck + visual verification**

Run: `cd frontend && bunx tsc --noEmit`
Open the app, verify campus renders mini offices per run with correct role dots and phase tint.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/campus/RunMiniOffice.tsx frontend/src/components/views/CampusView.tsx
git commit -m "CampusView: render mini office preview per run"
```

---

## Task 9: ⬜ Consolidate runRoles + roleDesks

**Files:**
- Modify: `frontend/src/lib/runRoles.ts`
- Modify: callers of visual mapping (if any duplicated after Task 1)

- [ ] **Step 1: Grep for duplicate role→color maps**

Run: `cd frontend && grep -rn "#a855f7\|#3b82f6\|#10b981\|#f59e0b" src/ | grep -v generated`

- [ ] **Step 2: Re-export visuals from runRoles or consolidate into roleDesks**

If `runRoles.ts` still owns `RoleKey` + `toNookRole`, fine — `roleDesks.ts` imports from it. If any other file hardcodes the role palette, replace with `roleToVisual`.

- [ ] **Step 3: Typecheck**

Run: `cd frontend && bunx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add -A frontend/src/lib/ frontend/src/
git commit -m "Consolidate role visuals under roleDesks"
```

---

## Task 10: ⬜ Final integration verification

- [ ] **Step 1: Full typecheck + lint**

Run: `cd frontend && bun run typecheck && bun run lint`
Expected: no errors

- [ ] **Step 2: Full test suite**

Run: `cd frontend && bun test`
Expected: all tests pass

- [ ] **Step 3: Backend checkall (untouched, safety check)**

Run: `cd backend && make checkall`
Expected: green

- [ ] **Step 4: Visual end-to-end**

With `make dev-tmux` running + `python3 /tmp/slow_sim.py` feeding a run:
- Campus: verify mini office previews render per run with correct role dots
- Click a run → TeamOffice: 4 role agents seated at desks + orchestrator as boss, whiteboard shows plan tasks
- Click a character → focus popup shows role/model/session/task
- Click ← campus → returns to campus view
- No PixiJS console errors (the `_cancelResize` bug stays fixed)

- [ ] **Step 5: Commit any polish**

```bash
git add -A
git commit -m "Polish: resolve final integration issues"
```
