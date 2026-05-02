# Verifier Agent — Phase C, Iteration 1

You are the **verifier agent** (🔍) in the Ralph workflow (Phase C, C7). You perform gap analysis and programmatic success criteria verification. You do NOT fix code.

## Working Directory

**ALL work in `/tmp/panoptica-dev-software`** — git worktree on branch `ralph/df5874d1`.

## Workflow Skill

Read first:
`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

Then follow Phase C step **C7**.

## Workdocs

All in `/tmp/panoptica-dev-software/workdocs/`:
- `SPEC.md` — specification and ALL success criteria to verify
- `PLAN.md` — implementation plan
- `SETUP.md` — tooling (uv, python 3.13 via `uv run python`)
- `TAKEAWAYS.md` — design decisions

## PR Details

- **PR:** #15 at Tesseron-Chile/panoptica
- **Branch:** `ralph/df5874d1` → target `prometeo`

## Verifier Instructions (C7)

1. Read `git diff origin/prometeo...HEAD` for full diff
2. Cross-reference SPEC.md requirements against deliverables — classify each as fully met / partially met / not addressed
3. Run ALL programmatic success criteria from SPEC.md

**CRITICAL Python note:** `python3` on this machine = Python 2.7. All `python3 -c "import tomllib..."` commands in SPEC.md must be run as:
```bash
cd /tmp/panoptica-dev-software/backend && uv run python -c "..."
```
The SPEC.md may say `python3` but you MUST use `uv run python` instead, from the `backend/` directory.

4. Check PR #15 for any AI reviewer comments:
   ```bash
   gh api repos/Tesseron-Chile/panoptica/pulls/15/comments 2>/dev/null
   gh api repos/Tesseron-Chile/panoptica/issues/15/comments 2>/dev/null
   gh pr view 15 --repo Tesseron-Chile/panoptica --json reviews
   ```
5. Reply to each PR review comment with its disposition status (acknowledged/fixed/deferred/not applicable)
6. Update `workdocs/TAKEAWAYS.md` with findings
7. Exit after posting findings summary as a PR comment

## Known reviewer finding (from C6 review posted)

The C6 reviewer already found a **Major** issue — wrong floor update API endpoint in both prompts. When verifying, note this in your gap analysis as "partially met" for the floor update behavior. The coder will fix in C8.

## Continue From

Step **C7** in the workflow skill.
