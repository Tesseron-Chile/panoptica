# Ralph Coder Prompt — Run A-1, Phase C Iteration 1 (C8)

You are the **coder agent** (🔨) in the Ralph workflow (Phase C, C8).
Your task: fix 5 minor findings from the PR reviewer. These are small, targeted changes — no refactoring, no scope creep.

## Repo & branch

- Working directory: `/Users/albertocastrobravo/Documents/MJM/panoptica`
- Feature branch: `ralph/bb32f8f1`
- PR: https://github.com/Tesseron-Chile/panoptica/pull/7

## IMPORTANT: uv path

`uv` is NOT on the default PATH. Use full path `/Users/albertocastrobravo/.local/bin/uv` for all uv commands.
For backend commands: `cd /Users/albertocastrobravo/Documents/MJM/panoptica/backend` first.

## Changes required

### Fix 1 — Remove dead `TYPE_CHECKING` block from `scheduler.py`

File: `backend/app/core/scheduler.py`

Remove lines 13 (`from typing import TYPE_CHECKING`) and 21-22 (`if TYPE_CHECKING:\n    pass`).

**Before:**
```python
import logging
from typing import TYPE_CHECKING

from apscheduler.schedulers.asyncio import AsyncIOScheduler
...
from app.core.floor_config import FloorConfig

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)
```

**After:**
```python
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
...
from app.core.floor_config import FloorConfig

logger = logging.getLogger(__name__)
```

### Fix 2 — Remove stale comment from `agent_runner.py`

File: `backend/app/core/agent_runner.py`

Remove line 92: `        # Verify flags against installed Claude Code version during Run A-1.`

**Before:**
```python
        logger.info("AgentRunner: launching task=%r for floor=%r", task, floor_id)
        # Note: claude -p runs in non-interactive print mode.
        # Verify flags against installed Claude Code version during Run A-1.
        await asyncio.create_subprocess_exec(
```

**After:**
```python
        logger.info("AgentRunner: launching task=%r for floor=%r", task, floor_id)
        # Note: claude -p runs in non-interactive print mode.
        await asyncio.create_subprocess_exec(
```

### Fix 3 & 4 — Add error handling and suppress subprocess I/O in `agent_runner.py`

File: `backend/app/core/agent_runner.py`

Wrap the subprocess call in try/except and add DEVNULL for stdout/stderr.

**Before:**
```python
        logger.info("AgentRunner: launching task=%r for floor=%r", task, floor_id)
        # Note: claude -p runs in non-interactive print mode.
        await asyncio.create_subprocess_exec(
            "claude",
            "-p",
            prompt,
            env=env,
            cwd=cwd,
        )
```

**After:**
```python
        logger.info("AgentRunner: launching task=%r for floor=%r", task, floor_id)
        # Note: claude -p runs in non-interactive print mode.
        try:
            await asyncio.create_subprocess_exec(
                "claude",
                "-p",
                prompt,
                env=env,
                cwd=cwd,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
        except FileNotFoundError:
            logger.exception(
                "AgentRunner: 'claude' not found on PATH — task=%r floor=%r",
                task,
                floor_id,
            )
```

### Fix 5 — Add `test_scheduler_skips_is_c_level_floor` to `test_scheduler.py`

File: `backend/tests/test_scheduler.py`

Add this test after `test_scheduler_skips_floors_with_no_schedule` (after line 48):

```python
def test_scheduler_skips_is_c_level_floor():
    c_level = FloorConfig(
        id="c_level",
        name="C Level",
        floor_number=99,
        accent="#8b5cf6",
        icon="👑",
        schedule=FloorSchedule(daily=["ceo_briefing"], weekly=["board_review"]),
        mission="Strategic oversight",
        workdocs_dir="workdocs/c_level/",
        is_c_level=True,
    )
    dev = _make_floor("dev_software", daily=["task1"], weekly=[])
    scheduler = FloorScheduler(floors=[c_level, dev])
    # c_level has tasks in its schedule but is_c_level=True → must be skipped
    assert scheduler.job_count() == 1
```

## Verification

After all changes, run:

```bash
cd /Users/albertocastrobravo/Documents/MJM/panoptica/backend && /Users/albertocastrobravo/.local/bin/uv run pytest tests/test_scheduler.py tests/test_agent_runner.py -v
```

All tests must pass (5 scheduler tests + 4 agent_runner tests). Then run:

```bash
cd /Users/albertocastrobravo/Documents/MJM/panoptica && make checkall
```

ruff format, ruff lint, and all tests must pass (pyright will still exit non-zero due to 551 pre-existing errors unrelated to this run — that is expected and acceptable).

## Commit

Stage and commit all changes with:

```
git add backend/app/core/scheduler.py backend/app/core/agent_runner.py backend/tests/test_scheduler.py
git commit -m "fix(scheduler,agent_runner): remove dead TYPE_CHECKING, add FileNotFoundError handling, suppress subprocess I/O, add is_c_level test"
```

Then push to origin:

```bash
git push origin ralph/bb32f8f1
```

## Success marker

When done, append this exact line to `workdocs/PLAN.md` under a new section `## Phase C Fixes`:

```
- [x] C8 minor fixes: TYPE_CHECKING removed, stale comment removed, FileNotFoundError handling added, DEVNULL added, is_c_level test added
```

Then commit:
```
git add workdocs/PLAN.md
git commit -m "chore(workdocs): mark C8 fixes complete"
```

Exit with code 0.
