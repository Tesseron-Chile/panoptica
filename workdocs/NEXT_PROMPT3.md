# NEXT_PROMPT3 — Coder (Phase B, iteration 3)

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

Claim **`plan-task-3`** (Synthetic event types + EventData extensions). Dependencies (plan-task-1, plan-task-2) are ✅.

Implementation spec lives in section **"Task 3: Synthetic event types + EventData extensions"** of:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

Read that section first.

## Process

1. **B2:** Read skill + workdocs; verify branch.
2. **B3:** Mark `plan-task-3` as `- [🔧]` in `workdocs/PLAN.md`; commit `chore(plan): claim plan-task-3`.
3. **B4:** `cd backend && uv run pytest --collect-only -q 2>&1 | tail -3`.
4. **B5:** TDD per plan doc:
   - Create `backend/tests/test_events_run.py` with the failing tests.
   - Run it, expect fail.
   - Edit `backend/app/models/events.py`: add `RUN_START`, `RUN_PHASE_CHANGE`, `RUN_END`, `ROLE_SESSION_JOINED` to `EventType`; add the new fields to `EventData` (run_id, orchestrator_session_id, primary_repo, workdocs_dir, from_phase, to_phase, outcome, ralph_role, ralph_task_id, model_config_dict).
   - Run tests, expect pass.
   - Commit per plan-doc message.
5. **B6:** Self-review diff.
6. **B7:** `cd backend && uv run pytest tests/test_events_run.py -v` green.
7. **B8:** PLAN.md sanity.
8. **B9:** `cd backend && uv run pytest tests/ -q` — must stay at 265+ passed.
9. **B10:** Add a learning only if non-obvious.
10. **B11:** Mark `- [x] plan-task-3: ... — Session: completed cleanly`. Commit. Exit.

## Extra notes

- Do NOT name the new EventData field `model_config` — it would collide with Pydantic's `ConfigDict`. Use `model_config_dict` as a plain field name (safe, since it's just a snake_case name that doesn't collide).
- Existing `EventData` already has many optional fields; follow the same pattern (all new fields default to `None`).
- `EventData` does not currently use `alias_generator`; keep it that way. Event payloads come from hooks which emit snake_case JSON and are routed by field name.
- Use `uv run pytest`. Commit frequently.
- Do NOT edit files unrelated to `events.py` and `tests/test_events_run.py`.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
