# Team Office Merge — Specification

## Problem
The 3-tier view hierarchy (Campus → RunOfficeView → NookDrillDown) fragments a sequential team workflow into isolated per-role UIs. Users can't see the whole team at a glance and must click through to inspect each role — while seeing one lone agent in an empty office that doesn't match Ralph's shared-context reality.

## Target behavior

### RunOfficeView (replaces current tier-2 + tier-3)
- Single `<OfficeGame />` PixiJS canvas sized to the available space.
- All role members (designer, coder, verifier, reviewer) rendered as agent sprites seated at stable desks: designer=1, coder=2, verifier=3, reviewer=4.
- Orchestrator session rendered via the existing `BossSprite`.
- Unfilled role slots: desk + chair rendered, no agent sprite.
- Whiteboard sprite inside the canvas shows `run.planTasks` with status glyphs (✓ / ● / ○).
- Right sidebar (`OfficeSidebar`): repo/branch, phase pill, elapsed time, task ratio, back-to-campus control.
- Click a sprite → existing `CharacterFocusPopup` extended with role, model, task title.

### CampusView
- Each run card's body replaced by a `<RunMiniOffice>` component.
- Mini office: pure CSS, ~120×80px, shows 4 role-colored dots at desk positions (gray if unfilled), phase-colored wall tint, thin progress bar.
- Card click → `goToRunOffice(runId)` (unchanged handler).

### Deletions
- `frontend/src/components/views/NookDrillDown.tsx`
- `frontend/src/components/office/NookSidebar.tsx`
- `frontend/src/components/office/RoleNook.tsx` (if no other consumer)
- `navigationStore`: `activeNookSessionId`, `goToNookDrillDown`, `"drilldown"` view variant

## Success criteria (programmatic)

1. `cd frontend && bunx tsc --noEmit` → exit 0.
2. `cd frontend && bun test` → all tests pass (including new `roleDesks.test.ts` and `useRunAgentHydration.test.tsx`).
3. `cd frontend && bun run lint` → exit 0.
4. `cd backend && make checkall` → exit 0 (unchanged; safety check).
5. `rg -n 'NookDrillDown|NookSidebar|activeNookSessionId|goToNookDrillDown|RoleNook' frontend/src/` → no matches outside `__tests__/` or comments documenting the removal.
6. `roleDesks.ts` exports `ROLE_KEYS`, `roleToDesk`, `roleToVisual` with shapes defined in `docs/plans/2026-04-19-team-office-merge.md` Task 1.
7. `useRunAgentHydration` hook: adding/removing members in the run updates `gameStore.agents` accordingly; unmount clears all.

## Architecture
- New hook: `useRunAgentHydration(run, sessionsById)` — effect-based diff of `run.memberSessionIds` against `gameStore.agents`, using `roleToDesk` + `roleToVisual` for stable placement. Orchestrator excluded (handled by BossSprite).
- New lib: `roleDesks.ts` — canonical source of role→desk and role→visual mapping. All palette hardcoding elsewhere removed.
- New component: `OfficeSidebar` — DOM-only, reads from `runStore`.
- New component: `RunMiniOffice` — CSS-only, reads `memberRoles` + `phase` + `planTasks` counts.
- Modified: `CharacterFocusPopup` looks up `session → role → model + task` via stores.
- Modified: `Whiteboard` accepts optional `planTasks` prop, renders status glyphs.

## Non-goals
- Backend changes.
- New agent state events or WS wiring.
- Animation polish beyond what the mockup shows.
- Accessibility audit (future work).

## Reference
- Mockup: `/tmp/panoptica-mockups.html` (served at http://localhost:7777/panoptica-mockups.html while the HTTP server runs).
- Plan: `docs/plans/2026-04-19-team-office-merge.md`.
