# NEXT_PROMPT21 — Verifier (Opus) for PR #5

You are a **verifier agent** (🔍) in Phase C of the Ralph workflow.
Workspace: `/Users/m.cadilecaceres/dev/tesseron/panoptica`. Branch:
`feature/ralph-panoptica-spec-a-plan2`. PR: Tesseron-Chile/panoptica#5.

Read the Ralph skill at
`~/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`
and the verifier template at `agents/verifier.md`.

## Context

Plan 2 frontend (18 tasks) just landed. SPEC has programmatically verifiable
success criteria (SC-1..SC-9 in `workdocs/SPEC.md`). TAKEAWAYS.md contains
a "Plan 2 final verification" table from Task 18.

## Your job

1. **Gap analysis:** Read SPEC.md against the implementation. What's missing
   or half-built? Cross-check PLAN.md ✅ markers against the actual code.
2. **Success criteria verification:** Run each SC-1..SC-9 as a real check.
   For UI ones, use `make dev-tmux` + headless browser or read the rendered
   DOM via playwright if needed. For backend ones, use curl. For simulation,
   run `python scripts/simulate_events.py run_lifecycle` and verify events flow.
3. **Scan PR comments from AI reviewers and the local reviewer** (if posted
   by the time you arrive): `gh pr view 5 --repo Tesseron-Chile/panoptica
   --comments` and line-review comments via gh api. Reply to each with a
   disposition (valid / invalid / deferred).

## Output

Write `workdocs/VERIFY.md`:
- SC-1..SC-9 pass/fail table with evidence
- Gaps found
- PR comment disposition count
- Overall verdict: Converged / Needs coder fix pass

Exit. The orchestrator reads VERIFY.md and decides whether to spawn a fix-coder (C8) or declare convergence.
