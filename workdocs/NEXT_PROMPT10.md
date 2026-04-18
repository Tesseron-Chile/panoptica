# NEXT_PROMPT10 — Coder (Phase B, iteration 10)

You are a **coder agent (🔨)** in the Ralph workflow. Read the Ralph skill and workdocs, then follow Phase B starting from **B2**.

## Ralph skill

- `~/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

## Workdocs to read (in order)

All paths relative to `/Users/m.cadilecaceres/dev/tesseron/panoptica`:

1. `workdocs/USER_PROMPT.md`
2. `workdocs/SPEC.md`
3. `workdocs/PLAN.md`
4. `workdocs/SETUP.md`
5. `workdocs/TAKEAWAYS.md`

## Branch

`feature/ralph-panoptica-spec-a`. Verify. Do NOT create a new branch.

## Your task

Claim **`plan-task-10`** (Wire tagger + aggregator into session_start / session_end). plan-task-1..9 are ✅.

Implementation spec lives in section **"Task 10: Wire tagger + aggregator into session_start / session_end"** of:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

Read that section first. You are INTEGRATING — touching existing handlers.

## Process

1. **B2:** Read skill + workdocs; verify branch.
2. **B3:** Mark `plan-task-10` as `- [🔧]`; commit `chore(plan): claim plan-task-10`.
3. **B4:** `cd backend && uv run pytest --collect-only -q 2>&1 | tail -3`.
4. **B5:** TDD per plan doc:
   - Read current `backend/app/core/handlers/session_handler.py` and `backend/app/core/event_processor.py` before editing.
   - Create `backend/tests/test_session_handler_ralph.py` with failing tests.
   - Run, expect fail.
   - Edit `session_handler.py` to classify via tagger + record into aggregator; edit `event_processor.py` only to wire the aggregator singleton.
   - Run, expect pass.
   - Commit per plan-doc message.
5. **B6:** Self-review diff. Make sure existing session_handler tests still pass.
6. **B7:** `cd backend && uv run pytest tests/test_session_handler_ralph.py -v` green.
7. **B8:** PLAN.md sanity.
8. **B9:** `cd backend && uv run pytest tests/ -q` — stay at 294+ passed.
9. **B10:** Learning only if non-obvious.
10. **B11:** Mark `- [x] plan-task-10: ... — Session: completed cleanly`. Commit. Exit.

## Extra notes

- **Preserve existing handler pattern**: handler takes callbacks/deps injected by `EventProcessor`. Do NOT import the aggregator at module scope inside the handler — keep it DI.
- Touch ONLY the 2 source files (`handlers/session_handler.py`, `event_processor.py`) + the new test file. If you find you need to change anything else, add a TAKEAWAYS note and exit without claiming done.
- Do not break existing `test_session_handler*.py` tests.
- Use `uv run pytest`. Commit frequently.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
