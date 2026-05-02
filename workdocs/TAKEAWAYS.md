# TAKEAWAYS

## Phase A Design Decisions

### Boss prompt location
The design spec mentions `workdocs/customer_service/boss-prompt.md`, but `agent_runner.py` loads boss prompts from `backend/prompts/<floor_id>_boss.md` via `_load_floor_prompt()`. We follow the existing convention: the boss prompt stays at `backend/prompts/customer_service_boss.md`. No modification to `agent_runner.py` needed.

### No agent_runner modifications
Per the design spec: "agent_runner.py se reusan sin modificación." All floor-specific details (inbox email, Gmail label, Linear project, vault path) are hardcoded in the boss prompt rather than injected dynamically from FloorConfig fields. The new FloorConfig fields exist for configuration completeness and frontend consumption, but the agent session reads them from the boss prompt.

### FloorConfig new fields are informational for the agent
The fields `inbox_email`, `gmail_label`, `linear_project`, `knowledge_vault` on `FloorConfig` are not passed to `agent_runner.run_floor_task()` (which only takes `floor_id`, `task`, `mission`, `workdocs_dir`). They serve two purposes: (1) configuration documentation in `floors.toml`, (2) potential frontend use (e.g., displaying inbox info on the floor card). The actual agent behavior is driven by the boss prompt.

### every_30min uses IntervalTrigger, not CronTrigger
The existing `daily` and `weekly` schedules use `CronTrigger`. The `every_30min` schedule uses `IntervalTrigger(minutes=30)` from APScheduler, which fires relative to the scheduler start time rather than at fixed clock times. This is intentional — inbox polling doesn't need to align to specific clock minutes.

### TOML schedule syntax
The design spec shows `[floors.schedule]` table header syntax for the CS floor's schedule. However, TOML table headers can only be used for the last `[[floors]]` entry — CS is floor_number=3, not the last floor. Use inline dot notation instead: `schedule.every_30min = [...]` and `schedule.daily = [...]`, which is the pattern already used by all other floors in `floors.toml`.

### Vault starts empty
The Obsidian vault is created with placeholder notes containing `[TODO: ...]` markers. The human populates real content over time. The improvement loop (consultas not resolved → human adds notes → future consultas resolved) is described in the design spec's Section 6 but is not part of this implementation scope.
