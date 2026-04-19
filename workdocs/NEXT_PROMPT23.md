# NEXT_PROMPT23 — Fix F1: Replace index-based role mapping with session.role

You are a **coder agent** (🔨) in Phase C, fix mode.
Workspace: `/Users/m.cadilecaceres/dev/tesseron/panoptica`. Branch:
`feature/ralph-panoptica-spec-a-plan2`. PR: Tesseron-Chile/panoptica#5.
Model: `claude-sonnet-4-6`.

## Read first

- `workdocs/REVIEW.md` and `workdocs/VERIFY.md` — context
- Backend: `backend/app/models/sessions.py` — Session has `role: str | None`
- Backend: `backend/app/models/runs.py` — Run has `member_session_ids: list[str]` (flat list, no role)
- `frontend/src/hooks/useSessions.ts` — existing session fetch pattern (exposes sessions with `role` field)
- Affected frontend files (consumers of index-based role):
  - `frontend/src/components/views/RunOfficeView.tsx:18`
  - `frontend/src/components/views/NookDrillDown.tsx:47`
  - `frontend/src/components/navigation/Breadcrumb.tsx`
  - `frontend/src/components/office/NookSidebar.tsx`

## The problem

`Run.memberSessionIds` is a flat list. Current code assumes
`[0]=Designer, [1]=Coder, [2]=Verifier, [3]=Reviewer` — fragile if sessions
join out of order.

## The fix (frontend-only preferred)

Use the existing session list from `useSessions` (which includes `session.role`)
to map session_id → role. Resolve role by looking up the session in the
sessions list via id, not by position in `memberSessionIds`.

Create a helper (e.g., `frontend/src/lib/runRoles.ts`):
```ts
export function getSessionsByRole(
  run: Run,
  sessions: Session[]
): Record<RoleKey, Session | null>
```
where `RoleKey = "designer" | "coder" | "verifier" | "reviewer"`.

Update the 4 consumers to use this helper. Fall back gracefully when a
session isn't loaded yet (treat as inactive nook).

## Tests

- Unit test for `getSessionsByRole`:
  - Out-of-order member IDs → correct role assignment
  - Duplicate roles (e.g., two coders) → first match wins, document behavior
  - Missing session in sessions list → role returns null
  - Empty memberSessionIds → all roles null

## Constraints

- No backend changes unless absolutely necessary. If the Session type
  in the frontend doesn't expose `role`, check its TS type / generated schema
  and add it there.
- Do NOT stage unrelated pre-existing WIP (Makefile, config.py, etc.).

## Success criteria

- All 4 consumers use role lookup, not `memberSessionIds[N]` position.
- New unit tests pass.
- `make -C frontend checkall` green.
- Reply on PR #5 to the role-mapping review comment confirming the fix.

## When done

Commit: `fix(runs): lookup role by session.id instead of array position (PR #5 follow-up)`.
Push. Exit.
