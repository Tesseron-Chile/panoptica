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

### FloorSchedule(**raw_schedule) handles every_30min automatically
Pydantic maps TOML inline dot notation `schedule.every_30min = [...]` directly to the `every_30min` field with no parser changes needed. SC-3 confirms end-to-end.

### T2: job_count() method already existed in FloorScheduler
SC-4 tests `s.job_count()` — this method was already present in the existing `scheduler.py`. No additions needed beyond the every_30min loop.

### T2: IntervalTrigger stores interval as timedelta
APScheduler `IntervalTrigger(minutes=30)` stores `trigger.interval` as `datetime.timedelta(minutes=30)`. Useful for test assertions.

### Pre-existing flaky test: test_ralph_pipeline_smoke
`test_ralph_smoke_end_to_end` fails intermittently with `FileExistsError` on a pytest `tmp_path` directory. Passes when run in isolation. Not related to any CS floor changes.

### T3: test_boss_prompts needed a targeted update
`test_boss_prompt_references_vault_templates` asserts all floor prompts reference `vault/_templates` or `_templates`. The new CS boss prompt intentionally embeds the workdoc format directly in the prompt (cleaner for a stateless email-processing agent) rather than referencing external templates. The test was updated to assert `workdocs/customer_service/` is present for CS, and the `_templates` check applies to all other floors unchanged.

### T3: workdocs_dir changed from vault/ to workdocs/
The old CS entry had `workdocs_dir = "vault/customer_service/"`. Updated to `workdocs/customer_service/` per SPEC. The vault path is now `knowledge_vault = "vault/customer_service/"` (for the agent to read knowledge) while workdocs go to `workdocs/customer_service/` (per-interaction documents).

### Vault starts empty
The Obsidian vault is created with placeholder notes containing `[TODO: ...]` markers. The human populates real content over time. The improvement loop (consultas not resolved → human adds notes → future consultas resolved) is described in the design spec's Section 6 but is not part of this implementation scope.
