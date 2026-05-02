# Coder Agent — Phase B, Session 6

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

**T6** — Tests and validation (final Phase B task).

T1 ✅, T2 ✅, T3 ✅, T4 ✅, T5 ✅ all done. T6 is the last task.

## Extra Notes

### What to add

Append new tests to `backend/tests/test_agent_runner.py`. The file already has tests for `build_floor_prompt()` and `run_floor_task()` — **do not modify those**. Add at the end:

**Test 1 — `run_ralph_session` launches subprocess with correct args:**
```python
@pytest.mark.asyncio
async def test_run_ralph_session_launches_subprocess():
    runner = AgentRunner()
    mock_proc = MagicMock()
    mock_proc.pid = 99

    with patch(
        "app.core.agent_runner.asyncio.create_subprocess_exec", new_callable=AsyncMock
    ) as mock_exec:
        mock_exec.return_value = mock_proc
        await runner.run_ralph_session(
            floor_id="dev_software",
            ticket_id="PRO-42",
            brief_path="vault/dev_software/PRO-42-brief.md",
        )

    mock_exec.assert_called_once()
    call_args = mock_exec.call_args
    assert call_args.args[0] == "claude"
    assert call_args.args[1] == "-p"
    assert "PRO-42-brief.md" in call_args.args[2]  # prompt contains brief path
    assert "--dangerously-skip-permissions" in call_args.args
    env = call_args.kwargs.get("env", {})
    assert env.get("CLAUDE_OFFICE_FLOOR_ID") == "dev_software"
    assert env.get("CLAUDE_OFFICE_TASK") == "PRO-42"
```

**Test 2 — graceful fallback when feature agent prompt file missing:**
```python
@pytest.mark.asyncio
async def test_run_ralph_session_missing_prompt_degrades_gracefully():
    runner = AgentRunner()
    mock_proc = MagicMock()

    with patch(
        "app.core.agent_runner.asyncio.create_subprocess_exec", new_callable=AsyncMock
    ) as mock_exec, patch(
        "app.core.agent_runner.Path.read_text", side_effect=FileNotFoundError
    ):
        mock_exec.return_value = mock_proc
        # Should not raise even when prompt file is missing
        await runner.run_ralph_session(
            floor_id="dev_software",
            ticket_id="PRO-99",
            brief_path="vault/dev_software/PRO-99-brief.md",
        )

    mock_exec.assert_called_once()
```

**Test 3 — regression: `run_floor_task` still works (verifies T4 did not break existing behavior):**
```python
@pytest.mark.asyncio
async def test_run_floor_task_regression_after_t4():
    """Regression: run_floor_task must still work after run_ralph_session was added."""
    runner = AgentRunner()
    mock_proc = MagicMock()

    with patch(
        "app.core.agent_runner.asyncio.create_subprocess_exec", new_callable=AsyncMock
    ) as mock_exec:
        mock_exec.return_value = mock_proc
        await runner.run_floor_task(
            floor_id="dev_software",
            task="revisar Linear Todo y despachar feature agents via ralph",
            mission="Construir y mantener el software de Prometeo",
            workdocs_dir="vault/dev_software/",
        )

    mock_exec.assert_called_once()
    env = mock_exec.call_args.kwargs.get("env", {})
    assert env.get("CLAUDE_OFFICE_FLOOR_ID") == "dev_software"
```

### Success criteria

**Step 1 — Run backend tests:**
```bash
cd /tmp/panoptica-dev-software/backend && uv run pytest tests/test_agent_runner.py -v
```
All tests must pass (including the 3 new ones).

**Step 2 — Run full backend check:**
```bash
cd /tmp/panoptica-dev-software/backend && make checkall
```
All fmt, lint, typecheck, test must pass. Fix any issues found.

**Step 3 — Verify import:**
```bash
cd /tmp/panoptica-dev-software/backend && uv run python -c "import app.core.agent_runner; print('import OK')"
```

**Step 4 — Verify floors.toml (use uv run python, NOT python3):**
```bash
cd /tmp/panoptica-dev-software/backend && uv run python -c "
import tomllib
with open('floors.toml', 'rb') as f:
    config = tomllib.load(f)
ds = [f for f in config['floors'] if f['id'] == 'dev_software'][0]
assert ds['linear_project'] == 'Prometeo'
assert len(ds['schedule']['daily']) == 1
assert 'Linear' in ds['schedule']['daily'][0]
print('floors.toml OK')
"
```

**Step 5 — Run SPEC.md criteria 1–4 and 6 (rg checks, no python3 needed):**
```bash
cd /tmp/panoptica-dev-software && \
test -f backend/prompts/dev_software_boss.md && \
rg "Linear" backend/prompts/dev_software_boss.md && \
rg "chrome_qa" backend/prompts/dev_software_boss.md && \
test -f backend/prompts/dev_software_feature_agent.md && \
rg "brief" backend/prompts/dev_software_feature_agent.md && \
test -f backend/prompts/workdoc_templates/brief.md && \
rg "ticket_id" backend/prompts/workdoc_templates/brief.md && \
rg "chrome_qa" backend/prompts/workdoc_templates/brief.md && \
test -f backend/prompts/workdoc_templates/result.md && \
rg "ticket_id" backend/prompts/workdoc_templates/result.md && \
rg "qa_result" backend/prompts/workdoc_templates/result.md && \
rg "async def run_ralph_session" backend/app/core/agent_runner.py && \
rg "ticket_id" backend/app/core/agent_runner.py && \
echo "SPEC criteria PASS"
```

All 5 steps must pass before marking T6 ✅.

### Python version note

**CRITICAL:** `python3` on this machine aliases to Python 2.7. It does NOT have `tomllib` or support `str | None` type annotations.
- Always use `cd backend && uv run python` (CPython 3.13 via uv) for any Python commands.
- The success criteria above already use `uv run python` everywhere — follow this exactly.

### Import needed in test file

The file already imports `AgentRunner` and `build_floor_prompt`. Just append the new tests at the bottom — no new imports needed beyond what's already there.

## Continue From

Step **B2** in the workflow skill.
