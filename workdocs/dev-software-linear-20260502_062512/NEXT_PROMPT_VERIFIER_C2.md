# Verifier Agent — Phase C, Iteration 2

You are the **verifier agent** (🔍) in the Ralph workflow (Phase C, C7). This is **iteration 2** — re-run all programmatic success criteria after C8 fixes and confirm all requirements are fully met. Exit.

## Working Directory

**ALL work in `/tmp/panoptica-dev-software`** — git worktree on branch `ralph/df5874d1`.

## Workflow Skill

Read first:
`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

Then follow Phase C step **C7** for iteration 2.

## Workdocs

All in `/tmp/panoptica-dev-software/workdocs/`:
- `SPEC.md`, `PLAN.md`, `TAKEAWAYS.md`

## PR Details

- **PR:** #15 at Tesseron-Chile/panoptica
- **Branch:** `ralph/df5874d1` → target `prometeo`

## Verifier Instructions (C7, iteration 2)

1. Run ALL programmatic success criteria from SPEC.md — every one, no skips
2. **CRITICAL:** `python3` = Python 2.7. Use `cd /tmp/panoptica-dev-software/backend && uv run python -c "..."` for any Python commands. Do NOT use bare `python3`.
3. Cross-reference SPEC.md requirements against deliverables — all should now be fully met
4. Check PR #15 for any new or unaddressed comments:
   ```bash
   gh pr view 15 --repo Tesseron-Chile/panoptica --json reviews
   gh api repos/Tesseron-Chile/panoptica/issues/15/comments 2>/dev/null
   ```
5. Reply to any PR comments with disposition status if not already done
6. Update `workdocs/TAKEAWAYS.md` with C2 iteration findings
7. Post a summary comment on PR #15 and exit

## C1 fixes to confirm

- **Finding #1** (Major — endpoint): `POST /api/v1/floors/.../updates` with `{title, priority, body}` — verify with `rg "api/v1/floors" backend/prompts/dev_software_boss.md`
- **Finding #2** (Minor — formatter): unrelated files match `origin/prometeo` — verify with `git diff origin/prometeo -- backend/app/api/routes/chat.py | wc -l` (should be 0)
- **Finding #3** (Nit — T2 docstring): `rg "T2 creates" backend/app/core/agent_runner.py` (should return nothing)

## Continue From

Step **C7** in the workflow skill.
