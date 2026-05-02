# Coder Agent — Phase B, Session 5

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

**T5** — Update `backend/floors.toml` for the `dev_software` floor.

T1 ✅, T2 ✅, T3 ✅, T4 ✅ done. T5 depends on T3 (daily task text must align with boss prompt behavior) — now unblocked.

## Extra Notes

### Current dev_software section in floors.toml

```toml
[[floors]]
id = "dev_software"
name = "Desarrollo Software"
floor_number = 5
accent = "#3b82f6"
icon = "💻"
mission = "Construir y mantener el software de Prometeo"
workdocs_dir = "vault/dev_software/"
schedule.daily = [
    "revisar PRs abiertos y asignar reviewers",
    "correr suite de tests y reportar failures",
    "actualizar workdoc de estado del sprint",
]
schedule.weekly = [
    "reporte de deuda tecnica y prioridades",
    "review de arquitectura y dependencias",
]
```

### What to change

Two changes, **only to the dev_software floor entry**:

1. Add `linear_project = "Prometeo"` — insert after the `workdocs_dir` line.

2. Replace the 3 daily tasks with a single task:
   ```toml
   schedule.daily = [
       "revisar Linear Todo y despachar feature agents via ralph",
   ]
   ```

3. Keep `schedule.weekly` unchanged (2 tasks, exact same text).

4. Do NOT touch any other floor in the file.

### Success criteria (from PLAN.md T5)

```bash
cd /tmp/panoptica-dev-software/backend && uv run python -c "
import tomllib
with open('floors.toml', 'rb') as f:
    config = tomllib.load(f)
ds = [f for f in config['floors'] if f['id'] == 'dev_software'][0]
assert ds['linear_project'] == 'Prometeo', 'missing linear_project'
assert len(ds['schedule']['daily']) == 1, f'expected 1 daily task, got {len(ds[\"schedule\"][\"daily\"])}'
assert 'Linear' in ds['schedule']['daily'][0], 'daily task not updated'
assert len(ds['schedule']['weekly']) == 2, 'weekly tasks modified unexpectedly'
for f in config['floors']:
    if f['id'] != 'dev_software':
        assert 'linear_project' not in f or f['id'] == 'customer_service', f'unexpected linear_project on {f[\"id\"]}'
print('PASS')
"
```

### Python version note

`python3` on this machine aliases to Python 2.7 and does NOT have `tomllib`. **Use `cd backend && uv run python`** for all Python verification. The success criteria command above already uses this correctly.

## Continue From

Step **B2** in the workflow skill.
