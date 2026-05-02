# PLAN — Linear-Driven dev_software Floor

## Task Dependency Graph

```
T1 (templates) ─┐
                 ├─→ T3 (boss prompt) ─→ T5 (floors.toml)
T2 (feature agent prompt) ─┘                    │
                                                 │
T4 (agent_runner) ──────────────────────────────┘
                                                 │
                                                 └─→ T6 (tests + validation)
```

T1 and T2 are independent. T3 depends on T1 (boss references template path). T4 is independent. T5 depends on T3 (daily task text must match prompt). T6 depends on all others.

---

## Tasks

### ✅ T1 — Create workdoc templates (brief + result)

**Files:** `backend/prompts/workdoc_templates/brief.md`, `backend/prompts/workdoc_templates/result.md`

**What:**
- Create directory `backend/prompts/workdoc_templates/`
- Write `brief.md` — template with YAML-style frontmatter fields: `ticket_id`, `title`, `priority`, `linear_url`, `branch`, `chrome_qa`, `created_by_boss`. Markdown sections: Descripción, Criterios de aceptación, Contexto adicional. All values are placeholders (`<...>`) for the boss to fill.
- Write `result.md` — template with frontmatter fields: `ticket_id`, `final_status`, `pr_url`, `qa_result`, `completed_at`. Markdown sections: Qué se hizo, QA, Issues encontrados. All values are placeholders.

**Success criteria:**
```bash
test -f backend/prompts/workdoc_templates/brief.md && \
rg "ticket_id" backend/prompts/workdoc_templates/brief.md && \
rg "chrome_qa" backend/prompts/workdoc_templates/brief.md && \
test -f backend/prompts/workdoc_templates/result.md && \
rg "ticket_id" backend/prompts/workdoc_templates/result.md && \
rg "qa_result" backend/prompts/workdoc_templates/result.md
```

Session: completed cleanly — both templates created at `backend/prompts/workdoc_templates/`, all success criteria pass.

---

### ⬜ T2 — Create feature agent prompt

**Files:** `backend/prompts/dev_software_feature_agent.md`

**What:**
- Write the prompt for autonomous feature agents. Must cover:
  - Role: autonomous feature developer for Prometeo
  - How to read the brief (`vault/dev_software/PRO-XX-brief.md`)
  - Ralph skill loop: plan → implement → QA → done
  - Chrome QA flow: when `chrome_qa: true`, use Chrome MCP to visually validate UI; when false, rely on tests + CI
  - Linear state transitions via MCP: `In Progress` → `In Review` (after impl) → `Done` (after QA pass); or back to `In Progress` on QA failure with detailed comment
  - Result workdoc: write `vault/dev_software/PRO-XX-result.md` using the result template
  - Floor update posting via API
- Follow the style of existing prompts (Spanish, concise, structured with markdown headers)

**Success criteria:**
```bash
test -f backend/prompts/dev_software_feature_agent.md && \
rg "brief" backend/prompts/dev_software_feature_agent.md && \
rg "chrome_qa" backend/prompts/dev_software_feature_agent.md && \
rg "Linear" backend/prompts/dev_software_feature_agent.md && \
rg "result" backend/prompts/dev_software_feature_agent.md && \
rg "ralph" backend/prompts/dev_software_feature_agent.md
```

---

### ⬜ T3 — Rewrite boss prompt as Linear dispatcher

**Depends on:** T1 (references template path)

**Files:** `backend/prompts/dev_software_boss.md`

**What:**
- Complete rewrite of the boss prompt. New content:
  - Identity: dispatcher (not implementer) for dev_software department
  - Linear MCP usage: `mcp__plugin_linear_linear__*` tools to query `Todo` tickets from Prometeo team
  - Priority ordering: Urgent > High > Normal > Low; oldest first within same priority
  - Max 3 tickets per activation
  - Per-ticket flow:
    1. Evaluate `chrome_qa` based on ticket description (UI → true, backend → false, ambiguous → true)
    2. Write brief to `vault/dev_software/PRO-XX-brief.md` using template from `backend/prompts/workdoc_templates/brief.md`
    3. Launch ralph session via Bash: spawn `claude -p` CLI with the brief path and feature agent prompt as context (the boss agent runs as a Claude session and uses the Bash tool to spawn child sessions directly)
    4. Move ticket `Todo` → `In Progress` in Linear via MCP
  - Skip rules: ignore tickets in `In Progress` or `In Review`; skip tickets missing description or acceptance criteria
  - Constraints: never implement code, never monitor spawned agents
- Preserve the context header pattern (repos, tools, style) from existing boss prompts
- Reference `vault/dev_software/` for workdocs, `backend/prompts/workdoc_templates/brief.md` for template

**Success criteria:**
```bash
rg "Linear" backend/prompts/dev_software_boss.md && \
rg "dispatcher\|despachador\|despachar" backend/prompts/dev_software_boss.md && \
rg "chrome_qa" backend/prompts/dev_software_boss.md && \
rg "3 tickets\|máximo 3\|maximo 3" backend/prompts/dev_software_boss.md && \
rg "Todo" backend/prompts/dev_software_boss.md && \
rg "In Progress" backend/prompts/dev_software_boss.md && \
! rg "correr suite de tests" backend/prompts/dev_software_boss.md
```

---

### ⬜ T4 — Add `run_ralph_session()` to agent_runner.py

**Files:** `backend/app/core/agent_runner.py`

**What:**
- Add `run_ralph_session()` async method to the `AgentRunner` class
- Signature: `async def run_ralph_session(self, *, floor_id: str, ticket_id: str, brief_path: str) -> None`
- Behavior:
  - Load the feature agent prompt from `prompts/dev_software_feature_agent.md`
  - Build a prompt that instructs Claude to: read the brief at `brief_path`, follow the feature agent prompt, execute the ralph skill loop
  - Spawn `claude -p <prompt>` as fire-and-forget subprocess (same pattern as `run_floor_task`)
  - Set env vars: `CLAUDE_OFFICE_FLOOR_ID=<floor_id>`, `CLAUDE_OFFICE_TASK=<ticket_id>`
- Follow existing code patterns: use `asyncio.create_subprocess_exec`, same error handling, same logging style
- Do NOT modify `run_floor_task()` or `build_floor_prompt()` — those remain untouched

**Success criteria:**
```bash
rg "async def run_ralph_session" backend/app/core/agent_runner.py && \
rg "ticket_id" backend/app/core/agent_runner.py && \
rg "brief_path" backend/app/core/agent_runner.py && \
rg "dev_software_feature_agent" backend/app/core/agent_runner.py && \
python3 -c "
import ast, sys
tree = ast.parse(open('backend/app/core/agent_runner.py').read())
cls = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef) and n.name == 'AgentRunner'][0]
methods = [n.name for n in cls.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
assert 'run_ralph_session' in methods, 'method not on class'
assert 'run_floor_task' in methods, 'existing method missing (regression)'
print('PASS')
"
```

---

### ⬜ T5 — Update floors.toml for dev_software

**Depends on:** T3 (daily task text must align with boss prompt)

**Files:** `backend/floors.toml`

**What:**
- Add `linear_project = "Prometeo"` to the `dev_software` floor entry
- Replace daily tasks with single dispatcher task: `"revisar Linear Todo y despachar feature agents via ralph"`
- Keep weekly tasks unchanged
- Do NOT modify any other floor's configuration

**Success criteria:**
```bash
python3 -c "
import tomllib
with open('backend/floors.toml', 'rb') as f:
    config = tomllib.load(f)
ds = [f for f in config['floors'] if f['id'] == 'dev_software'][0]
assert ds['linear_project'] == 'Prometeo', 'missing linear_project'
assert len(ds['schedule']['daily']) == 1, f'expected 1 daily task, got {len(ds[\"schedule\"][\"daily\"])}'
assert 'Linear' in ds['schedule']['daily'][0], 'daily task not updated'
assert len(ds['schedule']['weekly']) == 2, 'weekly tasks modified unexpectedly'
# Verify no other floors changed
for f in config['floors']:
    if f['id'] != 'dev_software':
        assert 'linear_project' not in f or f['id'] == 'customer_service', f'unexpected linear_project on {f[\"id\"]}'
print('PASS')
"
```

---

### ⬜ T6 — Tests and validation

**Depends on:** T1, T2, T3, T4, T5

**Files:** `backend/tests/test_agent_runner.py` (modify or create)

**What:**
- Add unit test for `run_ralph_session()`: mock `asyncio.create_subprocess_exec`, verify it's called with correct args (`claude`, `-p`, prompt containing brief path), correct env vars (`CLAUDE_OFFICE_FLOOR_ID`, `CLAUDE_OFFICE_TASK`)
- Add unit test verifying `run_floor_task()` still works (no regression)
- Run `python3 -c "import tomllib; ..."` validation for `floors.toml`
- Run all success criteria from SPEC.md
- Run `make checkall` from project root (if available in worktree) or at minimum `cd backend && uv run python -c "import app.core.agent_runner"` to verify no import errors

**Success criteria:**
```bash
cd backend && uv run pytest tests/test_agent_runner.py -v && \
python3 -c "
import tomllib
with open('backend/floors.toml', 'rb') as f:
    config = tomllib.load(f)
print('floors.toml OK')
" && \
uv run python -c "import app.core.agent_runner; print('import OK')"
```
