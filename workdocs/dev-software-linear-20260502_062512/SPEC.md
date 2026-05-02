# SPEC — Linear-Driven dev_software Floor

## Problem Description

The `dev_software` floor (floor 5) currently operates with generic daily tasks (review PRs, run tests, update sprint workdoc). These tasks produce informational workdocs but don't drive autonomous feature development.

**Goal:** Redesign `dev_software` so Linear is the single source of truth for tasks. The boss becomes a pure dispatcher that reads `Todo` tickets from the Prometeo team in Linear, writes briefs, and launches independent ralph sessions per ticket. Feature agents execute the full plan-implement-QA-done cycle autonomously.

**Who benefits:** The development team gets autonomous ticket execution — tickets move through Linear states consistently, and result workdocs provide visibility via the visualizer's floor updates.

## Requirements

### Functional

1. **Boss as dispatcher:** The boss reads Linear `Todo` tickets via MCP, takes max 3 per activation, writes a brief workdoc per ticket, launches a ralph CLI session per ticket, and moves the ticket to `In Progress`. Completes in ~1 min.
2. **Priority ordering:** Urgent > High > Normal > Low; within same priority, oldest first.
3. **Brief generation:** Boss writes `vault/dev_software/PRO-XX-brief.md` following the brief template — includes ticket ID, title, priority, Linear URL, branch name, `chrome_qa` flag, description, acceptance criteria.
4. **`chrome_qa` determination:** Boss evaluates ticket description — UI/UX/React/frontend routes → true; backend/API/migrations/infra → false; ambiguous → true.
5. **Feature agent lifecycle:** Each agent reads its brief, plans, implements, runs QA (Chrome if `chrome_qa`, tests otherwise), writes result workdoc, moves ticket through Linear states (`In Progress` → `In Review` → `Done` or back to `In Progress` on QA failure).
6. **Result workdoc:** Agent writes `vault/dev_software/PRO-XX-result.md` with final status, PR URL, QA result, issues found. The existing `workdoc_watcher` picks this up and posts a floor update automatically.
7. **Guard rails:** Boss skips tickets already `In Progress`/`In Review`, skips tickets without description or acceptance criteria, never implements code itself.
8. **Failure handling:** Failed agents leave ticket in `In Progress`, result workdoc absent/incomplete. The `workdoc_watcher` alerts after 4h without result (existing behavior — no changes needed).

### Non-Functional

- Boss session completes in < 2 minutes.
- Feature agents operate fully independently — no coordination with boss after launch.
- Linear state transitions are consistent with actual work state.

### Security

- No credentials stored in prompts or briefs — Linear access is via MCP tools available in the Claude session.
- No raw secrets in workdocs or commit messages.

## Assumptions

1. Linear MCP tools (`mcp__plugin_linear_linear__*`) are available to boss agent sessions at runtime — these are configured in the Claude Code environment, not in our codebase.
2. Chrome MCP tools (`mcp__claude-in-chrome__*`) are available to feature agent sessions for UI QA.
3. The `ralph` skill is installed and available to spawned Claude CLI sessions.
4. The `FloorScheduler` (09:00 daily) already triggers `AgentRunner.run_floor_task()` — no scheduler changes needed.
5. The `workdoc_watcher` already detects new `.md` files in `vault/dev_software/` — no watcher changes needed.
6. The `floor_config.py` `FloorConfig` model already has a `linear_project` field — we can add it to `floors.toml` without model changes.

## Existing Architecture

### Key Files

| File | Role |
|------|------|
| `backend/app/core/agent_runner.py` | `AgentRunner` class — launches `claude -p` subprocesses with floor context via env vars. `_load_floor_prompt()` reads `prompts/<floor_id>_boss.md`. `build_floor_prompt()` prepends floor prompt to generic template. |
| `backend/app/core/scheduler.py` | APScheduler — daily tasks at 09:00, weekly Mondays 09:00. Calls `AgentRunner.run_floor_task()`. |
| `backend/app/core/workdoc_watcher.py` | Polls vault dirs every 60s, detects new `.md` files, triggers boss review → floor update. |
| `backend/app/core/floor_config.py` | `FloorConfig` Pydantic model with `linear_project` optional field. Loads from `floors.toml`. |
| `backend/floors.toml` | Floor definitions — `dev_software` has daily/weekly scheduled tasks. |
| `backend/prompts/dev_software_boss.md` | Current boss prompt — generic, not Linear-driven. |
| `vault/dev_software/` | Workdoc output directory (exists, empty). |
| `vault/_templates/` | Existing templates: `daily-brief.md`, `weekly-summary.md`, `critical-alert.md`. |

### How Floor Task Execution Works

1. `FloorScheduler` fires at 09:00 → calls `AgentRunner.run_floor_task(floor_id, task, mission, workdocs_dir)`
2. `build_floor_prompt()` loads `prompts/dev_software_boss.md`, appends generic template with task/mission/workdocs_dir
3. Spawns `claude -p <prompt>` with `CLAUDE_OFFICE_FLOOR_ID=dev_software` env var
4. Agent executes, writes workdoc to `vault/dev_software/`, posts floor update via API
5. `workdoc_watcher` detects new file → triggers boss review cycle

## Proposed Architecture

### Changes Overview

**Modify:**
- `backend/prompts/dev_software_boss.md` — rewrite as Linear dispatcher
- `backend/floors.toml` — update daily tasks, add `linear_project = "Prometeo"`
- `backend/app/core/agent_runner.py` — add `run_ralph_session()` method

**Create:**
- `backend/prompts/dev_software_feature_agent.md` — prompt for feature agents
- `backend/prompts/workdoc_templates/brief.md` — brief template for boss to fill
- `backend/prompts/workdoc_templates/result.md` — result template for feature agents

### Boss Prompt (`dev_software_boss.md`)

Complete rewrite. The new prompt defines the dispatcher role:
- Identity: dispatcher for dev_software, not an implementer
- Linear MCP usage: query `Todo` tickets from Prometeo team
- Priority logic: Urgent > High > Normal > Low
- Per-ticket flow: write brief → launch `claude` CLI session with ralph skill → move to In Progress
- `chrome_qa` determination rules
- Constraints: max 3 tickets, skip In Progress/In Review, skip tickets without description/AC
- Brief template reference: `backend/prompts/workdoc_templates/brief.md`

### Feature Agent Prompt (`dev_software_feature_agent.md`)

New file. Instructions for autonomous feature agents:
- Read brief from `vault/dev_software/PRO-XX-brief.md`
- Use ralph skill for plan → implement → QA cycle
- Chrome QA flow when `chrome_qa: true`
- Linear state transitions via MCP
- Result workdoc writing
- Floor update posting

### `run_ralph_session()` in `agent_runner.py`

New method on `AgentRunner`:
```python
async def run_ralph_session(
    self,
    *,
    floor_id: str,
    ticket_id: str,
    brief_path: str,
) -> None:
```

Spawns `claude -p <prompt>` where the prompt instructs the agent to:
1. Read the brief at `brief_path`
2. Read the feature agent prompt for context
3. Execute the ralph skill loop
4. The session runs independently (fire-and-forget, same as `run_floor_task`)

Environment variables: `CLAUDE_OFFICE_FLOOR_ID=dev_software`, `CLAUDE_OFFICE_TASK=PRO-XX`.

### `floors.toml` Changes

```toml
[[floors]]
id = "dev_software"
# ... existing fields unchanged ...
linear_project = "Prometeo"
schedule.daily = [
    "revisar Linear Todo y despachar feature agents via ralph",
]
schedule.weekly = [
    "reporte de deuda tecnica y prioridades",
    "review de arquitectura y dependencias",
]
```

Daily tasks reduced to one dispatcher task. Weekly tasks unchanged.

### Workdoc Templates

`backend/prompts/workdoc_templates/brief.md` — YAML frontmatter + markdown sections matching the design spec brief format.

`backend/prompts/workdoc_templates/result.md` — YAML frontmatter + markdown sections matching the design spec result format.

## Testing Strategy

### Unit Tests

- `test_agent_runner.py`: test `run_ralph_session()` spawns subprocess with correct args and env vars (mock `asyncio.create_subprocess_exec`)
- `test_agent_runner.py`: test `build_floor_prompt()` still works correctly after changes (no regression)

### Structural / Content Tests

- Verify all new/modified files exist and contain expected patterns
- Verify `floors.toml` parses correctly with new `linear_project` field
- Verify prompt files contain required keywords (Linear MCP, chrome_qa, brief template, etc.)

### Integration (not in scope for this run)

- Full Linear MCP integration (requires live Linear workspace)
- Chrome MCP QA flow (requires running frontend)
- End-to-end boss dispatch cycle

## Success Criteria

### Per-File Criteria

1. **`backend/prompts/dev_software_boss.md`** exists and contains: Linear MCP instructions, priority ordering rules, max 3 tickets, brief generation instructions, `chrome_qa` determination, Claude CLI launch instructions for ralph sessions, skip rules for In Progress/In Review tickets
   ```bash
   test -f backend/prompts/dev_software_boss.md && \
   rg "Linear" backend/prompts/dev_software_boss.md && \
   rg "chrome_qa" backend/prompts/dev_software_boss.md && \
   rg "3 tickets" backend/prompts/dev_software_boss.md && \
   rg "claude" backend/prompts/dev_software_boss.md
   ```

2. **`backend/prompts/dev_software_feature_agent.md`** exists and contains: brief reading instructions, ralph skill reference, Chrome QA flow, Linear state transitions, result workdoc writing
   ```bash
   test -f backend/prompts/dev_software_feature_agent.md && \
   rg "brief" backend/prompts/dev_software_feature_agent.md && \
   rg "chrome_qa" backend/prompts/dev_software_feature_agent.md && \
   rg "result" backend/prompts/dev_software_feature_agent.md
   ```

3. **`backend/prompts/workdoc_templates/brief.md`** exists and contains ticket_id, title, priority, chrome_qa, branch fields
   ```bash
   test -f backend/prompts/workdoc_templates/brief.md && \
   rg "ticket_id" backend/prompts/workdoc_templates/brief.md && \
   rg "chrome_qa" backend/prompts/workdoc_templates/brief.md
   ```

4. **`backend/prompts/workdoc_templates/result.md`** exists and contains ticket_id, final_status, pr_url, qa_result fields
   ```bash
   test -f backend/prompts/workdoc_templates/result.md && \
   rg "ticket_id" backend/prompts/workdoc_templates/result.md && \
   rg "qa_result" backend/prompts/workdoc_templates/result.md
   ```

5. **`backend/floors.toml`** has `linear_project = "Prometeo"` under dev_software and updated daily task
   ```bash
   python3 -c "
   import tomllib
   with open('backend/floors.toml', 'rb') as f:
       config = tomllib.load(f)
   ds = [f for f in config['floors'] if f['id'] == 'dev_software'][0]
   assert ds['linear_project'] == 'Prometeo', 'missing linear_project'
   assert any('Linear' in t or 'linear' in t for t in ds['schedule']['daily']), 'daily task not updated'
   print('PASS')
   "
   ```

6. **`backend/app/core/agent_runner.py`** has `run_ralph_session` method with `floor_id`, `ticket_id`, `brief_path` parameters
   ```bash
   rg "async def run_ralph_session" backend/app/core/agent_runner.py && \
   rg "ticket_id" backend/app/core/agent_runner.py && \
   rg "brief_path" backend/app/core/agent_runner.py
   ```

### Whole-Project Criteria

7. **No regressions**: `floors.toml` parses without error, all existing floors intact
   ```bash
   python3 -c "
   import tomllib
   with open('backend/floors.toml', 'rb') as f:
       config = tomllib.load(f)
   ids = [f['id'] for f in config['floors']]
   for expected in ['c_level', 'dev_software', 'dev_hardware', 'customer_service', 'financiero', 'mkt_ventas']:
       assert expected in ids, f'missing floor {expected}'
   print('PASS')
   "
   ```

8. **Type check passes** for `agent_runner.py`
   ```bash
   cd backend && uv run python -c "import app.core.agent_runner; print('PASS')"
   ```

## Coding Guidelines

- Follow existing patterns in `agent_runner.py` — fire-and-forget subprocess, same env var convention.
- Boss prompt in Spanish (matches all other floor prompts).
- Feature agent prompt in Spanish.
- Templates use YAML-style frontmatter (key: value) matching the design spec format.
- `run_ralph_session()` method goes on the `AgentRunner` class, parallel to `run_floor_task()`.
