# NEXT_PROMPT24 — Fix F2: Consolidate duplicate WS connections + subscribeWithSelector

You are a **coder agent** (🔨) in Phase C, fix mode.
Workspace: `/Users/m.cadilecaceres/dev/tesseron/panoptica`. Branch:
`feature/ralph-panoptica-spec-a-plan2`. Model: `claude-sonnet-4-6`.

## Read first

- `workdocs/REVIEW.md` findings #1 and #3
- `frontend/src/hooks/useRunList.ts` — opens per-run WS for `run_state`
- `frontend/src/hooks/useRunEvents.ts` — opens per-run WS for events
- `frontend/src/hooks/useRunWebSocket.ts` — the single-run channel hook

## The problem

Currently every run gets **two** WS connections: one from `useRunList` for
`run_state` snapshots and one from `useRunEvents` for typed events. Backend
pushes both message types over the same `_run:<runId>` channel. Opening
two is wasteful and complicates reconnection state.

Also, `useRunEvents.subscribe()` on the runStore fires on every state change
(N-per-poll), iterating all runs each time.

## The fix

1. **Shared WS channel per run.** Introduce a `useRunChannel(runId)` (or
   extend `useRunWebSocket`) that opens **one** WS connection per run and
   demuxes message types — `run_state` → `setRun()` in runStore; events
   (`run_start`, `run_phase_change`, `run_end`, `role_session_joined`) →
   event dispatch. `useRunList` manages the roster; `useRunEvents` consumes
   event dispatch only.

   Simplest shape: a single manager hook owns a `Map<runId, WebSocket>`
   and exposes:
   - Register: `useRunList` tells the manager which runIds are active.
   - Subscribe: `useRunEvents` subscribes to a callback per event type.

   Acceptable alternative: merge `useRunEvents` into `useRunList` so only
   one hook owns sockets, and `useRunEvents.ts` becomes a thin re-export
   (or deletion). Prefer deletion over dead re-export.

2. **subscribeWithSelector.** Use Zustand's `subscribeWithSelector` middleware
   (or equivalent) in runStore so that downstream consumers subscribe only
   to the slice they care about (e.g., the list of run IDs). Remove any
   O(runs) work in per-change callbacks.

## Tests

- Existing `useRunList` and `useRunEvents` tests must still pass (or be
  updated to reflect the consolidated API).
- Add a test verifying: for N active runs, **exactly N** WebSocket instances
  exist in the manager after setup (not 2N).
- Unit test the demux: a single message dispatches `run_state` AND event
  handlers correctly depending on payload type.

## Constraints

- Do NOT stage unrelated pre-existing WIP.
- Preserve the behavior guaranteed by SPEC.md SC-1..SC-9.

## Success criteria

- Per-run connection count is 1 (verifiable via test).
- Store subscription no longer does O(runs) work per `setRun` call.
- `make -C frontend checkall` green.
- Reply on PR #5 to both review comments (Major #1, Minor #3).

## When done

Commit: `refactor(runs): single WS connection per run + subscribeWithSelector (PR #5 follow-up)`.
Push. Exit.
