# Coder Agent — Phase B, Session 1

You are a **coder agent** (🔨) in the Ralph workflow. Implement exactly ONE task, verify it, and exit.

## Working Directory

**ALL work happens in `/tmp/panoptica-dev-software`** — git worktree on branch `ralph/df5874d1`.
The primary repo source files are at `/Users/albertocastrobravo/Documents/MJM/panoptica`.

Run all commands from `/tmp/panoptica-dev-software`.

## Workflow Skill

Read first:
`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

## Workdocs

All in `/tmp/panoptica-dev-software/workdocs/`:
- `SPEC.md` — spec and success criteria
- `PLAN.md` — your task is here
- `SETUP.md` — tooling setup
- `TAKEAWAYS.md` — read before starting

## Your Task

Pick from PLAN.md. There are 3 independent unclaimed tasks: **T1, T2, T4**.

Choose **T1** (highest downstream impact — T3 boss prompt depends on it).

T1 = Create workdoc templates:
- `backend/prompts/workdoc_templates/brief.md`
- `backend/prompts/workdoc_templates/result.md`

See T1 in PLAN.md for exact field requirements and success criteria.

## Extra Notes

- The `backend/prompts/` directory exists in the worktree (check with `ls backend/prompts/`). Create the `workdoc_templates/` subdirectory.
- Follow the YAML-style frontmatter + markdown sections format described in SPEC.md and the design spec (`workdocs/2026-05-02-linear-driven-floor-design.md`).
- Templates are filled by boss/agent at runtime — all values must be `<placeholder>` format.
- Run the T1 success criteria bash commands from `/tmp/panoptica-dev-software` before marking ✅.
- After marking ✅, commit and exit. Do NOT pick up T2 or T4.

## Continue From

Step **B2** in the workflow skill.
