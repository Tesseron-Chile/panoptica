# REVIEW.md — PR #5 Phase C Reviewer Report

**Reviewer:** 🔎 AI Reviewer (Opus)
**PR:** Tesseron-Chile/panoptica#5
**Branch:** `feature/ralph-panoptica-spec-a-plan2` → `main`
**Date:** 2026-04-19

## Overall Verdict: Request Changes

The implementation is architecturally sound and aligns with SPEC.md. All 18 tasks completed, TypeScript compiles cleanly, no `any` leaks, no security issues. Store/hook separation is clean. The 2 Major findings are about resource waste and a fragile implicit contract — both fixable without restructuring.

## Findings by Severity

### Critical (0)

None.

### Major (2)

1. **Duplicate WebSocket connections per run** (`useRunEvents.ts`, `useRunList.ts`)
   - Both hooks independently open WS connections to `_run:<runId>`, resulting in 2 concurrent connections per active run.
   - Documented as deliberate in TAKEAWAYS.md but doubles client+server WS resource usage.
   - Fix: share a single connection per run and demux `run_state` vs `event` message types.

2. **Index-based role mapping is fragile** (`RunOfficeView.tsx:18`, `NookDrillDown.tsx:47`, `Breadcrumb.tsx`, `NookSidebar.tsx`)
   - `memberSessionIds[0]=Designer, [1]=Coder, [2]=Verifier, [3]=Reviewer` — no backend ordering guarantee.
   - If sessions join out-of-order, role labels are silently wrong across the entire UI.
   - Fix: use session `role` field from the backend Session model, or document ordering as an explicit contract with a backend test.

### Minor (3)

3. **Store subscription in `useRunEvents` fires on every state change** (`useRunEvents.ts:191`)
   - `useRunStore.subscribe()` fires on every `setRun` call (N times per 5s poll cycle), iterating all runs each time.
   - Consider `subscribeWithSelector` or diffing run IDs.

4. **`run_end` defaults outcome to `"completed"` on missing detail** (`useRunEvents.ts:144`)
   - Malformed event makes a stuck/abandoned run show a success checkmark.
   - Should default to `"in_progress"` (no-op) or log a warning.

5. **Missing component render tests** (`CampusView.tsx`, `RunOfficeView.tsx`, `TaskWhiteboard.tsx`)
   - SPEC.md testing strategy item 3 requires render tests for these components. Store/hook tests exist but component render tests are absent.

### Nit (1)

6. **Hardcoded `localhost:3400` URLs** (`useRunList.ts:7`, `useRunEvents.ts:34`, `useRunWebSocket.ts:43`, `page.tsx`)
   - Repeated across 4+ files. A shared config constant would reduce maintenance burden. May be intentional for this project (existing hooks follow same pattern).

## Security Assessment

- No credentials in workdocs or code.
- WS `_run:` channel validates run ID format via regex before connecting (`RUN_ID_RE` in `main.py`).
- No XSS vectors — all user-facing data is rendered via React (auto-escaped).
- No SQL injection — backend uses SQLAlchemy ORM.

## Comments Posted

6 inline comments posted on PR #5 via `gh api` (COMMENT event — cannot REQUEST_CHANGES on own PR).
