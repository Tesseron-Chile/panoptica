# Coder Agent — Phase B, Session 2

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

**T4** — Add `run_ralph_session()` to `backend/app/core/agent_runner.py`.

T1 (templates) ✅ done. T2 (feature agent prompt) ⬜ pending. T4 is independent — pick it.

## Extra Notes

### Existing code structure (already read for you)

`agent_runner.py` has:
- Module-level `_PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"`
- `_load_floor_prompt(floor_id)` — reads `prompts/<floor_id>_boss.md`
- `build_floor_prompt(...)` — builds prompt string
- `AgentRunner` class with `run_floor_task(*, floor_id, task, mission, workdocs_dir, workdir)` — fires `claude -p <prompt>` as `asyncio.create_subprocess_exec`, non-awaited, logs, handles `FileNotFoundError`

### What to add

Add `run_ralph_session` as a new async method on `AgentRunner`, after `run_floor_task`. Signature:

```python
async def run_ralph_session(
    self,
    *,
    floor_id: str,
    ticket_id: str,
    brief_path: str,
) -> None:
```

Behavior:
1. Load feature agent prompt: `(_PROMPTS_DIR / "dev_software_feature_agent.md").read_text(encoding="utf-8")` — if file doesn't exist yet, use empty string (T2 creates it; T4 must not fail if T2 hasn't run)
2. Build prompt: instruction to read brief at `brief_path`, follow the feature agent prompt, use ralph skill
3. Spawn `claude -p <prompt> --dangerously-skip-permissions` fire-and-forget (same `asyncio.create_subprocess_exec` pattern, same `DEVNULL` stdout/stderr, same `FileNotFoundError` handling)
4. Env vars: `CLAUDE_OFFICE_FLOOR_ID=floor_id`, `CLAUDE_OFFICE_TASK=ticket_id`
5. Log: `"AgentRunner: launching ralph session ticket=%r floor=%r", ticket_id, floor_id`

### Constraints
- **DO NOT modify** `run_floor_task`, `build_floor_prompt`, or `_load_floor_prompt`
- `--dangerously-skip-permissions` is required for unattended ralph sessions
- The feature agent prompt file may not exist yet (T2 creates it) — handle gracefully

### Success criteria (from PLAN.md T4)

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

Run from `/tmp/panoptica-dev-software`.

## Continue From

Step **B2** in the workflow skill.
