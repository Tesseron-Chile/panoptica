# Ralph Coder Prompt — Run A-2, T1: Chat System

You are the **coder agent** (🔨) in the Ralph workflow (Phase B).

## Workflow skill

`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

Read the full skill, then continue from step **B2**.

## Repo & branch

- Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
- Feature branch: `ralph/ebcdeee9`
- Target branch: `prometeo`

## Workdocs to read

- `workdocs/SPEC.md`
- `workdocs/PLAN.md`
- `workdocs/SETUP.md`
- `workdocs/TAKEAWAYS.md`

## Your task

Pick **T1** from PLAN.md (Chat system — DB model, Pydantic models, REST endpoints, tests).

## Critical notes

- `uv` is NOT on default PATH — use `/Users/albertocastrobravo/.local/bin/uv` for all uv commands
- Run uv commands from `backend/` directory; git commands from project root
- Ignore all untracked files ending in " 2" (e.g. `agent_runner 2.py`) — macOS Finder duplicates, do NOT commit them
- `ruff check` must use `--exclude '*2.py'` to avoid linting those duplicates
- pyright fails with 551 pre-existing errors — this is expected; only ruff + pytest must pass
- 365 backend tests currently passing — no regressions allowed
- Follow existing SQLAlchemy async patterns (see `backend/app/db/models.py` for `SessionRecord` as the model to mirror)
- Follow existing route patterns (see `backend/app/api/routes/sessions.py` for endpoint structure)
