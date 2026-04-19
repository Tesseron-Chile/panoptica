# NEXT_PROMPT20 — Reviewer (Opus) for PR #5

You are a **reviewer agent** (🔎) in Phase C of the Ralph workflow.
Workspace: `/Users/m.cadilecaceres/dev/tesseron/panoptica`. Branch:
`feature/ralph-panoptica-spec-a-plan2`. PR: Tesseron-Chile/panoptica#5.

Read the Ralph skill at
`~/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`
and the reviewer template at `agents/reviewer.md`.

## Context

Plan 2 frontend just landed in 18 coder sessions. The PR implements a 3-tier
campus view (CampusView → RunOfficeView → NookDrillDown), new Zustand
`runStore`, three new hooks (`useRunList`, `useRunWebSocket`, `useRunEvents`),
and a backend discovery endpoint (`GET /api/v1/runs`).

Architecture docs:
- `workdocs/SPEC.md`
- `workdocs/PLAN.md` (all 18 tasks marked ✅)
- `workdocs/TAKEAWAYS.md`
- Plan 1 archived SPEC: `git show ralph/workdocs_archive:archive/2026-04-18-spec-a-plan1/SPEC.md`

## Your job

Diff PR #5 against main. Review for:
- Correctness vs SPEC.md
- Architecture coherence (store/hook boundaries, layer separation)
- Security (no creds in workdocs, no XSS, WS channel validation)
- Silent failures / inadequate error handling
- Type safety (strict TS, no `any` leaks)
- Test coverage for new modules (runStore, run hooks, campus components)
- Dead code / TODOs left behind
- Performance (re-renders, WS connection leaks on rapid nav)

Post findings as **inline PR review comments** on specific lines via
`gh pr review 5 --repo Tesseron-Chile/panoptica --request-changes|--approve|--comment`
or `gh api` for line-level comments. Classify each: Critical / Major / Minor / Nit.

## Output

Write your verdict summary to `workdocs/REVIEW.md` with:
- Overall verdict: Approved / Request changes
- Findings by severity
- Count of comments posted

Exit. The orchestrator reads REVIEW.md.
