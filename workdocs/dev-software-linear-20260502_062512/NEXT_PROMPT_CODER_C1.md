# Coder Agent — Phase C, Iteration 1 (Fix)

You are the **coder agent** (🔨) in the Ralph workflow (Phase C, C8). Fix the findings from the reviewer and verifier. Commit, push, and exit.

## Working Directory

**ALL work in `/tmp/panoptica-dev-software`** — git worktree on branch `ralph/df5874d1`.
Remote: `origin` at Tesseron-Chile/panoptica.

## Workflow Skill

Read first:
`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

Then follow Phase C step **C8**.

## Workdocs

All in `/tmp/panoptica-dev-software/workdocs/`:
- `SPEC.md`, `PLAN.md`, `TAKEAWAYS.md`

## Findings to fix

### Finding 1 — MAJOR: Wrong floor update API endpoint in boss and feature agent prompts

**Affected files:**
- `backend/prompts/dev_software_boss.md` (the `curl` command)
- `backend/prompts/dev_software_feature_agent.md` (the `curl` commands)

**Current (wrong):**
```bash
curl -s -X PATCH http://localhost:8000/api/floors/dev_software/update \
  -H "Content-Type: application/json" \
  -d '{"status":"done","message":"..."}'
```

**Correct endpoint** (verified from `backend/app/api/routes/floor_updates.py` and `agent_runner.py` line 39):
```bash
curl -s -X POST http://localhost:8000/api/v1/floors/<floor_id>/updates \
  -H "Content-Type: application/json" \
  -d '{"title":"<resumen 1 línea>","priority":"<info|alert|critical>","body":"<detalle>"}'
```

Three differences: `POST` not `PATCH`, `/api/v1/` prefix, `/updates` not `/update`.
Payload fields: `title`, `priority` (`info`|`alert`|`critical`), `body` — not `status`/`message`.

Fix both files. Keep the calls contextually accurate:
- Boss (after dispatching tickets): `title` = summary of dispatched tickets, `priority` = `"info"`, `body` = details
- Feature agent (on start/done/failed): `title` = brief headline, `priority` = `"info"` or `"alert"` on failure, `body` = detail

### Finding 2 — MINOR: Revert ruff formatting in unrelated files

Ruff auto-formatted these files during `make checkall`, but they contain no task changes — revert them to match `origin/prometeo`:

```bash
git checkout origin/prometeo -- \
  backend/app/api/routes/chat.py \
  backend/app/api/routes/clevel.py \
  backend/tests/test_proposals_api.py \
  backend/tests/test_boss_prompts.py
```

Verify no functional changes were lost (these are pure formatting reverts).

### Finding 3 — NIT: Fix task-reference comment in agent_runner.py

**File:** `backend/app/core/agent_runner.py`

Find the docstring for `run_ralph_session` that says:
> `T2 creates the feature-agent prompt file; if it doesn't exist yet this method degrades gracefully.`

Replace with:
> `If the feature-agent prompt file does not exist yet, this method degrades gracefully using an empty string.`

(The task reference "T2" is meaningless after merge.)

### Finding 4 — NIT: PLAN.md customer_service exception

This is in `workdocs/PLAN.md` test-validation code — not production code. Skip; it will be archived with workdocs and is acceptable as-is.

## After fixing

1. Run `cd /tmp/panoptica-dev-software/backend && make checkall` — must pass
2. Commit all fixes with a clear message
3. Push to `origin ralph/df5874d1`
4. Exit

## Python version note

`python3` = Python 2.7 on this machine. Use `cd backend && uv run python` for any Python checks.

## Continue From

Step **C8** in the workflow skill.
