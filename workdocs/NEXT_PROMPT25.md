# NEXT_PROMPT25 — Fix F3: Component render tests

You are a **coder agent** (🔨) in Phase C, fix mode.
Workspace: `/Users/m.cadilecaceres/dev/tesseron/panoptica`. Branch:
`feature/ralph-panoptica-spec-a-plan2`. Model: `claude-sonnet-4-6`.

## Read first

- `workdocs/SPEC.md` — testing strategy requires render tests for CampusView, RunOfficeView, TaskWhiteboard
- `workdocs/REVIEW.md` Minor #5
- Existing vitest + RTL patterns: `frontend/src/stores/*.test.ts`, `frontend/src/hooks/*.test.ts`
- Target components:
  - `frontend/src/components/views/CampusView.tsx`
  - `frontend/src/components/views/RunOfficeView.tsx`
  - `frontend/src/components/office/TaskWhiteboard.tsx`

## The task

Add component render tests using `@testing-library/react` (install if not already a devDep — check package.json first).

**CampusView tests:**
- Renders placeholder "No active Ralph runs" when store has zero runs.
- Renders N RunOfficeCard components when store has N runs.
- Renders HotDeskArea with sessions where `session.run_id == null`, filters out run-attached ones.
- Clicking a run card calls `goToRunOffice(runId)`.

**RunOfficeView tests:**
- Renders OrchestratorStation + 4 RoleNooks.
- Active nooks (role has a session in memberSessionIds) are not dimmed; inactive are.
- Back button calls `goToCampus()`.
- Clicking an active nook calls `goToNook(runId, sessionId)`.

**TaskWhiteboard tests:**
- Renders tasks grouped by status into todo/in_progress/done columns.
- Empty columns show placeholder text.
- Correct count per column from fixture data.

Use fixture factories for Run/PlanTask/Session to keep tests DRY.

## Constraints

- Frontend-only.
- Do NOT stage unrelated pre-existing WIP.
- If RTL isn't installed, install `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` as devDeps.

## Success criteria

- All 3 components have render tests; all assertions listed above covered.
- `make -C frontend checkall` green.
- vitest output shows new tests passing.
- Reply on PR #5 to the render-test review comment.

## When done

Commit: `test(runs): component render tests for CampusView/RunOfficeView/TaskWhiteboard (PR #5 follow-up)`.
Push. Exit.
