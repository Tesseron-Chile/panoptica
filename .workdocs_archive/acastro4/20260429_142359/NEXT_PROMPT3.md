# Ralph Coder Prompt — Run A-2, T2: Floor Updates

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

Pick **T2** from PLAN.md (Floor updates — DB model, Pydantic models, REST endpoints, tests). T1 is already ✅.

## Critical notes

- `uv` is NOT on default PATH — use `/Users/albertocastrobravo/.local/bin/uv` for all uv commands
- Run uv commands from `backend/` directory; git commands from project root
- Ignore all untracked files ending in " 2" (e.g. `agent_runner 2.py`) — macOS Finder duplicates, do NOT commit them
- `ruff check` must use `--exclude '*2.py'` to avoid linting those duplicates
- pyright fails with 551 pre-existing errors — this is expected; only ruff + pytest must pass
- T1 added `ChatMessageRecord` to `backend/app/db/models.py` and `chat.py` router — read those files before adding `FloorUpdateRecord` to mirror the same patterns
- Two routers needed: `floor_router` (prefix `/floors`) and `updates_router` (prefix `/updates`) — register both in `main.py`
