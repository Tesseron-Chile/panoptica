# NEXT_PROMPT1 — Coder (Phase B, iteration 1)

You are a **coder agent (🔨)** in the Ralph workflow. Read the Ralph skill and the workdocs below, then follow Phase B starting from **B2**.

## Ralph skill

Read in full before doing anything else:

- `~/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

## Workdocs to read (in order)

All paths are relative to the repo root `/Users/m.cadilecaceres/dev/tesseron/panoptica`:

1. `workdocs/USER_PROMPT.md`
2. `workdocs/SPEC.md`
3. `workdocs/PLAN.md`
4. `workdocs/SETUP.md`
5. `workdocs/TAKEAWAYS.md`

## Branch

You are on branch `feature/ralph-panoptica-spec-a`. Verify with `git branch --show-current` before making any edit. Do NOT create a new branch.

## Your task

Implement exactly **ONE** task from `workdocs/PLAN.md`, then exit.

Prefer `plan-task-1` (Run domain types) since it has no dependencies and blocks most of the rest. If for some reason it is already ✅ or 🔧 with no open handoff, fall back to the next unclaimed ⬜ task with satisfied dependencies.

The full detailed plan lives at:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

**Before implementing**, open that file and read the section titled **"Task 1: Run domain types"** (or the task section matching the task you actually claimed). It contains the exact file paths, failing test code, implementation code, commands, and commit message. Use it as ground truth.

## Process (per Ralph Phase B)

1. **B2:** Read the skill and workdocs; verify branch.
2. **B3:** Claim `plan-task-1` by changing `- [ ]` to `- [🔧]` in `workdocs/PLAN.md` and **commit immediately** with message `chore(plan): claim plan-task-1`.
3. **B4:** Verify tooling: `cd backend && uv run pytest --collect-only -q tests/ 2>&1 | tail -5` (just checking the test runner works).
4. **B5:** Implement the task following the plan-doc section. TDD: failing test → implementation → passing test. Commit after each logical step.
5. **B6:** Self-review your diff.
6. **B7:** UAT equivalent for backend: `cd backend && uv run pytest tests/<new_test_file>.py -v` green.
7. **B8:** Reread `workdocs/PLAN.md` and fix any stale references your changes broke.
8. **B9:** Re-run the full test module from scratch: `cd backend && uv run pytest tests/ -q`. Must be green.
9. **B10:** Append a short learning to `workdocs/TAKEAWAYS.md` if something non-obvious came up (skip if nothing worth recording).
10. **B11:** Mark the task ✅ in `workdocs/PLAN.md` (e.g. `- [x] plan-task-1: ... — Session: completed cleanly`). Commit everything. Exit.

## Extra notes

- `model_config` collides with Pydantic's own `ConfigDict` attribute. The plan doc calls this out — use attribute name `model_config_` with alias `modelConfig`. Read the plan-doc Task 1 notes before writing tests.
- Existing Pydantic models in `backend/app/models/` follow `ConfigDict(alias_generator=to_camel, populate_by_name=True)`. Match that shape.
- Use `uv run pytest` (not bare `pytest`).
- Commit frequently. Small commits are preferred.
- Do NOT modify files outside those listed for your task. If you find you need to, escalate via `TAKEAWAYS.md` and exit.

## Continue from

**B2** in `skills/ralph-workflow/SKILL.md`.
