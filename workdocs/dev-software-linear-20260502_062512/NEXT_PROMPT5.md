# Coder Agent — Phase B, Session 4

You are a **coder agent** (🔨) in the Ralph workflow. Implement exactly ONE task, verify it, and exit.

## Working Directory

**ALL work in `/tmp/panoptica-dev-software`** — git worktree on branch `ralph/df5874d1`.
Primary repo source at `/Users/albertocastrobravo/Documents/MJM/panoptica` for reference.

## Workflow Skill

Read first:
`/Users/albertocastrobravo/.claude/plugins/cache/tesseron-tools/ralph/1.0.1/skills/ralph-workflow/SKILL.md`

## Workdocs

All in `/tmp/panoptica-dev-software/workdocs/`:
- `SPEC.md`, `PLAN.md`, `SETUP.md`, `TAKEAWAYS.md`

## Your Task

**T3** — Rewrite `backend/prompts/dev_software_boss.md` as a Linear dispatcher.

T1 ✅, T2 ✅, T4 ✅ done. T3 depends on T1 (references brief template path) — it is now unblocked.

## Extra Notes

### Context

The boss is a short-lived (~1–2 min) Claude session launched by the backend scheduler. It reads Linear, dispatches feature agents per ticket via Bash, and exits. It never writes code. It is a pure dispatcher.

### Existing file to replace

`backend/prompts/dev_software_boss.md` — complete rewrite required. The existing content is:
- Old vault template references (`vault/_templates/`) — those do NOT exist; remove them
- Old tools list — replace with current tools
- Old "correr suite de tests" behavior — must be removed (success criteria explicitly checks for its absence)

### What to write

**Keep from existing prompt:**
- Intro: "Eres el jefe autónomo del departamento de Desarrollo Software de Prometeo"
- Repo context: Tesseron-Chile/panoptica, FastAPI + Next.js 15 + PixiJS, CI: GitHub Actions (make checkall)

**Replace everything else with the new dispatcher behavior:**

**Identity section:**
- Role: pure dispatcher (despachador), not implementer
- Session target: complete in < 2 minutes
- Never implement code; never monitor spawned feature agents

**Herramientas section:**
- `mcp__plugin_linear_linear__*` — Linear MCP for reading and moving tickets
- `git`, `gh` — for writing briefs to vault (git commit after writing)
- Bash — for spawning `claude` CLI sessions

**Linear query section:**
- Query Prometeo team for tickets in state `Todo`
- Use `mcp__plugin_linear_linear__list_issues` (filter by team Prometeo, status Todo)
- Priority ordering: Urgent > High > Normal > Low; oldest first within same priority
- Max 3 tickets per activation
- Skip rules: ignore tickets already in `In Progress` or `In Review`; skip tickets without description or acceptance criteria

**Per-ticket flow (for each ticket, in order):**

1. **Evaluate `chrome_qa`:**
   - UI/UX/React/frontend/componente/vista/pantalla → `true`
   - Backend/API/migration/infra/test/script → `false`
   - Ambiguous → `true`

2. **Write brief** to `vault/dev_software/<ticket_id>-brief.md` using the template at `backend/prompts/workdoc_templates/brief.md`. Fill all fields: `ticket_id`, `title`, `priority`, `linear_url`, `branch` (e.g. `feat/<ticket_id>-<slug>`), `chrome_qa`, `created_by_boss` (current timestamp). Fill sections from ticket description and acceptance criteria.

3. **Commit brief** to git: `git add vault/dev_software/<ticket_id>-brief.md && git commit -m "chore(boss): write brief for <ticket_id>"`

4. **Launch feature agent** via Bash (fire-and-forget, do NOT wait for exit):
   ```bash
   CLAUDE_OFFICE_FLOOR_ID=dev_software \
   CLAUDE_OFFICE_TASK=<ticket_id> \
   claude --model claude-sonnet-4-6 --dangerously-skip-permissions \
     -p "$(cat backend/prompts/dev_software_feature_agent.md)

   Brief path: vault/dev_software/<ticket_id>-brief.md" &
   ```
   The `&` is critical — boss does NOT wait for the feature agent.

5. **Move ticket** `Todo` → `In Progress` in Linear via `mcp__plugin_linear_linear__save_issue`.

**After all tickets:** post one floor update:
```bash
curl -s -X PATCH http://localhost:8000/api/floors/dev_software/update \
  -H "Content-Type: application/json" \
  -d '{"status":"done","message":"Despachados N tickets: PRO-X, PRO-Y, ..."}'
```

**Vault section:**
- Workdocs viven en `vault/dev_software/` (git-versioned)
- Brief template: `backend/prompts/workdoc_templates/brief.md`
- Result template: `backend/prompts/workdoc_templates/result.md` (los feature agents lo usan)

**Estilo de trabajo section:**
- Prioridad: estabilidad > features > deuda técnica
- Comunicación: workdocs concisos; no novelas
- Escalación: ticket sin descripción/AC → skip con log; PR bloqueado +3 días → priority "critical"

### Success criteria (from PLAN.md T3)

```bash
rg "Linear" backend/prompts/dev_software_boss.md && \
rg "dispatcher\|despachador\|despachar" backend/prompts/dev_software_boss.md && \
rg "chrome_qa" backend/prompts/dev_software_boss.md && \
rg "3 tickets\|máximo 3\|maximo 3" backend/prompts/dev_software_boss.md && \
rg "Todo" backend/prompts/dev_software_boss.md && \
rg "In Progress" backend/prompts/dev_software_boss.md && \
! rg "correr suite de tests" backend/prompts/dev_software_boss.md
```

Run from `/tmp/panoptica-dev-software`.

### Python version note

`python3` on this machine aliases to Python 2.7. Use `cd backend && uv run python` for any Python verification. Do NOT use bare `python3`.

## Continue From

Step **B2** in the workflow skill.
