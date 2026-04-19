# NEXT_PROMPT22 — Fix coder for PR #5 (C8 fast-path)

You are a **coder agent** (🔨) in Phase C, fix mode (nit_tolerance=low).
Workspace: `/Users/m.cadilecaceres/dev/tesseron/panoptica`. Branch:
`feature/ralph-panoptica-spec-a-plan2`. PR: Tesseron-Chile/panoptica#5.
Model: `claude-sonnet-4-6`.

Read the Ralph skill + `agents/coder.md` (Phase C Fix Mode section).

## Read first

- `workdocs/REVIEW.md` — reviewer findings
- `workdocs/VERIFY.md` — verifier dispositions (authoritative — follow these)
- The PR's inline review comments: `gh pr view 5 --repo Tesseron-Chile/panoptica --comments`

## Extra Notes — the ONLY finding to fix

**Comment #4 (Minor, valid-fix): `run_end` outcome default**
- File: `frontend/src/hooks/useRunEvents.ts:144`
- Bug: on malformed `run_end` event (no `detail.outcome`), code defaults to `"completed"` — makes a stuck/abandoned run show as success.
- Fix: keep `run.outcome` unchanged if `detail.outcome` is missing/unrecognized (no-op). Log a warning.
- Add/extend a unit test to cover: `run_end` event with no outcome field → existing outcome preserved, warning logged.

## Deferred findings (do NOT fix)

Per VERIFY.md, these are valid-defer and should NOT be addressed in this PR:
- Duplicate WS connections (Comment #1)
- Index-based role mapping (Comment #2)
- `subscribeWithSelector` optimization (Comment #3)
- Component render tests (Comment #5)

For each deferred and invalid finding, reply to the PR comment with the
disposition + rationale from VERIFY.md. Use `gh api repos/Tesseron-Chile/panoptica/pulls/5/comments/{id}/replies` for inline comment replies.

## Success criteria

- `run_end` with missing outcome is a no-op (outcome preserved).
- New unit test covers this case, passes.
- `make -C frontend checkall` green.
- Every PR review comment has a reply with disposition.

## When done

Commit: `fix(runs): preserve run.outcome on malformed run_end (PR #5 review fix)`.
Push. Exit.
