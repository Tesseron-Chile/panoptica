# Takeaways

## Setup Notes

- Worktree at `/tmp/panoptica-dev-software` on branch `ralph/df5874d1` (from `origin/prometeo`)
- Main worktree `ralph/c880279a` has an active Customer Service ralph run — do NOT touch it
- Design spec already approved: `workdocs/2026-05-02-linear-driven-floor-design.md`
- `skip_user_interaction = false` but user skipped SPEC/PLAN review (just approved design in brainstorm)
- Linear MCP available: `mcp__plugin_linear_linear__*` tools
- Chrome MCP available: `mcp__claude-in-chrome__*` tools for QA validation
- Target branch: `prometeo`

## Phase A Decisions

### Boss prompt: complete rewrite, not incremental edit
The existing `dev_software_boss.md` is a generic "autonomous head of department" prompt with no Linear integration. The design spec calls for a fundamentally different role (pure dispatcher). A rewrite is cleaner and less error-prone than trying to patch the existing content.

### `run_ralph_session()` as new method, not modification of `run_floor_task()`
`run_floor_task()` follows a specific pattern: builds prompt from floor boss template + generic template, sets env vars, spawns `claude -p`. The ralph session has different requirements (loads feature agent prompt, passes brief path, different prompt structure). Adding a separate method keeps both flows clean and avoids regression risk on existing floors.

### Daily tasks reduced to one
The design spec says the boss is a dispatcher — its only daily job is "revisar Linear Todo y despachar feature agents via ralph". The old daily tasks (review PRs, run tests, update sprint workdoc) are now handled by feature agents per-ticket. Weekly tasks (tech debt report, architecture review) remain since they're cross-cutting and not ticket-specific.

### `chrome_qa` determination in boss, not feature agent
The boss evaluates `chrome_qa` at brief-writing time because it has the ticket context fresh and can make the determination once. Feature agents receive it as a flag in the brief — they don't re-evaluate.

### No changes to scheduler, workdoc_watcher, or floor_config
These components already support the new pattern. The scheduler fires `run_floor_task()` which loads the boss prompt — we just change the prompt content. The watcher already monitors `vault/dev_software/`. `FloorConfig` already has `linear_project` field.

### Template location: `backend/prompts/workdoc_templates/`
Templates live under `backend/prompts/` (co-located with prompt files) rather than `vault/_templates/` because they're consumed by agents via prompt instructions, not by humans. The existing `vault/_templates/` are for different floor tasks (daily-brief, weekly-summary, critical-alert).

## Discovery Notes

- `backend/prompts/dev_software_boss 2.md` exists as what appears to be a backup — leaving it untouched.
- `floor_config.py` `FloorConfig` has `linear_project: str | None` — the customer_service floor already uses it with `linear_project = "Prometeo"`.
- All existing boss prompts are in Spanish — maintaining that convention.

## T6 Notes

- Pre-existing pyright errors (562) in `event_processor.py` and unrelated test files; none introduced by T6 changes. `make checkall` fails on typecheck due to these — but `ruff format`, `ruff check`, and all tests pass cleanly. Files touched in T6 (`agent_runner.py`, `test_agent_runner.py`, `floors.py`) have 0 pyright errors.
- Fixed two pre-existing ruff lint errors during T6: `E501` in `agent_runner.py` (template string) and `B008` in `floors.py` (mutable default arg). `I001` was auto-fixed by `ruff --fix`.

## Phase C — Verifier C7 Iteration 1 Findings

- **All 8 programmatic success criteria PASS**
- **29/29 unit tests pass**
- **11 of 12 requirements fully met**, 1 partially met (floor update endpoint bug)
- **Major issue confirmed:** Both `dev_software_boss.md` and `dev_software_feature_agent.md` use wrong floor update API endpoint — `PATCH .../api/floors/.../update` with `{status, message}` but correct is `POST .../api/v1/floors/.../updates` with `{title, priority, body}`. Will 404 at runtime.
- **Minor:** Formatting-only changes in unrelated files (ruff auto-format side-effects from T6 lint pass). Harmless but inflate diff.
- **Nit:** `agent_runner.py` docstring references "T2" task name — should be rephrased.
- **No AI reviewer comments** — empty responses on all PR comment endpoints. No external reviewers triggered.

## Workflow Notes
