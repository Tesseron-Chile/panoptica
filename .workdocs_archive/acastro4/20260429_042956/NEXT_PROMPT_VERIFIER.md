# Ralph Verifier Prompt — Run A-1

You are the **verifier agent** (🔍) in the Ralph workflow (Phase C, C7).

## Workflow skill

`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

## Repo & branch

- Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
- Feature branch: `ralph/bb32f8f1`
- Target branch: `main`
- PR number: 7
- Repo: Tesseron-Chile/panoptica

## Workdocs to read

- `workdocs/SPEC.md`
- `workdocs/PLAN.md`
- `workdocs/SETUP.md`
- `workdocs/TAKEAWAYS.md`

## IMPORTANT: uv path

`uv` is not on the default PATH. Use full path `/Users/albertocastrobravo/.local/bin/uv` for all uv commands.
For backend commands: cd to `/Users/albertocastrobravo/Documents/MJM/panoptica/backend` first.
For hooks commands: cd to `/Users/albertocastrobravo/Documents/MJM/panoptica/hooks` first.

## Extra notes

This is iteration 1 of Phase C. The reviewer (C6) posted **Verdict: Approved** with these findings:

**Minor:**
1. Dead `TYPE_CHECKING` block in `backend/app/core/scheduler.py` lines 13, 21-22 — remove `from typing import TYPE_CHECKING` and `if TYPE_CHECKING: pass`
2. Stale comment in `backend/app/core/agent_runner.py` line 92 — remove "Verify flags against installed Claude Code version during Run A-1."
3. No error handling for subprocess launch failure — `FileNotFoundError` if `claude` not on PATH; add `try/except` with `logger.exception()`
4. Subprocess stdout/stderr not suppressed — 22 cron jobs at 09:00 would all write to FastAPI stdout; add `stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL`
5. Test gap: `test_scheduler_skips_floors_with_no_schedule` doesn't test `is_c_level=True` skip behavior — add a dedicated test

**Nit:**
6. Formatting-only changes to unrelated test files add noise to diff (already happened, can't undo)
7. `slug` truncation in `build_floor_prompt` could cut mid-word (cosmetic, workdoc filenames only)

Your jobs:
1. Run all 7 programmatic success criteria from SPEC.md and record pass/fail
2. Classify each SPEC requirement as fully met / partially met / not addressed
3. Reply to the reviewer's PR review comment with "**Acknowledged** — passed to coder for C8 iteration"
4. Update TAKEAWAYS.md with findings summary
5. Exit

For the PR review reply: the reviewer's finding is in the review body (not individual line comments). Post a new conversation comment acknowledging:
```bash
gh api repos/Tesseron-Chile/panoptica/issues/7/comments \
  -f body="**Acknowledged** — all Minor findings passed to coder for C8 fixes. Nit #6 (formatter noise) is pre-existing and deferred; Nit #7 (slug truncation) is cosmetic and deferred."
```

No AI reviewers were configured for this run (ai_reviewer_triggers = []).
