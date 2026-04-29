# Ralph Verifier Prompt — Run A-2, Phase C Iteration 2

You are the **verifier agent** (🔍) in the Ralph workflow (Phase C, C7). This is **iteration 2**.

## Workflow skill

`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

## Repo & branch

- Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
- Feature branch: `ralph/ebcdeee9`
- Target branch: `prometeo`
- PR: #8 (Tesseron-Chile/panoptica)

## Workdocs to read

- `workdocs/SPEC.md`
- `workdocs/PLAN.md`
- `workdocs/TAKEAWAYS.md`

## Your jobs

1. Quickly re-run the key programmatic success criteria from SPEC.md (focus on regressions — pytest + ruff)
2. Verify the C8 fixes addressed the 1 partially-met requirement (input validation now has max_length + Literal on response)
3. Classify all SPEC requirements as fully met / partially met / not addressed — should all be fully met now
4. Check PR #8 for any new comments needing a disposition reply
5. Reply to the iteration 2 reviewer comment acknowledging zero new findings
6. Update `workdocs/TAKEAWAYS.md` with iteration 2 summary
7. Exit

## Extra notes

- `uv` NOT on PATH — use `/Users/albertocastrobravo/.local/bin/uv`
- Run from `backend/` for uv commands
- Reviewer iteration 2 verdict: **Approved, zero new findings** — all 5 prior findings confirmed fixed
- Post reply to the iteration 2 review acknowledging convergence:
  ```bash
  gh api repos/Tesseron-Chile/panoptica/issues/8/comments \
    -f body="**C7 Iteration 2:** All programmatic criteria verified. Convergence confirmed — zero findings remaining, all requirements fully met."
  ```
