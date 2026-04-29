# NEXT_PROMPT13 — Coder (Phase B, iteration 13 — FINAL)

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

Claim **`plan-task-13`** (Integration smoke test). All prior implementation tasks ✅. This is the LAST Phase B task.

Implementation spec lives in section **"Task 13: Integration smoke test"** of:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

Read that section first. End-to-end smoke test against Success Criteria #1–#4 from SPEC — stubbed inputs, no real Claude, no real Ralph.

## Process

1. **B2:** Read skill + workdocs; verify branch.
2. **B3:** Mark `plan-task-13` as `- [🔧]`; commit `chore(plan): claim plan-task-13`.
3. **B4:** `cd backend && uv run pytest --collect-only -q 2>&1 | tail -3`.
4. **B5:** Create `backend/tests/test_ralph_pipeline_smoke.py` per plan doc. Run, expect pass. Commit per plan-doc message.
5. **B6:** Self-review.
6. **B7:** `cd backend && uv run pytest tests/test_ralph_pipeline_smoke.py -v` green.
7. **B8:** PLAN.md sanity.
8. **B9:** `cd backend && uv run pytest tests/ -q` — stay at 298+ passed (expect 299+).
9. **B10:** Learning only if non-obvious.
10. **B11:** Mark `- [x] plan-task-13: ... — Session: completed cleanly`. Commit. Exit.

## Extra notes

- If the plan-doc test code references APIs that don't match the actual implementations from tasks 6–11, adapt the test minimally to the real APIs — do NOT change implementations just to match the plan doc's test verbatim. Note any adaptation in TAKEAWAYS.md.
- Do NOT edit anything besides the new test file.
- Use `uv run pytest`. Commit frequently.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
