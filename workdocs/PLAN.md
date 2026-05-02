# PLAN — Customer Service Floor

## Task Overview

| # | Task | Status | Depends On |
|---|------|--------|------------|
| T1 | Backend model extensions | 🔧 | — |
| T2 | Scheduler every_30min support | ⬜ | T1 |
| T3 | floors.toml + boss prompt | ⬜ | T1 |
| T4 | Obsidian vault structure | ⬜ | — |
| T5 | Integration validation | ⬜ | T1, T2, T3, T4 |

---

## T1 — Backend model extensions 🔧

**Goal:** Extend `FloorSchedule` and `FloorConfig` models to support CS-specific fields and the `every_30min` schedule type.

**Files to modify:**
- `backend/app/core/floor_config.py`

**Files to create/extend:**
- `backend/tests/test_floor_config_cs_fields.py` (new test file)

**Steps:**
1. Add `every_30min: list[str] = Field(default_factory=list)` to `FloorSchedule`
2. Add to `FloorConfig`:
   - `knowledge_vault: str = ""`
   - `inbox_email: str = ""`
   - `gmail_label: str = ""`
   - `linear_project: str = ""`
3. Update `load_building_config()` to parse the new fields from TOML entries:
   - `knowledge_vault` → `str(entry_dict.get("knowledge_vault", ""))`
   - `inbox_email` → `str(entry_dict.get("inbox_email", ""))`
   - `gmail_label` → `str(entry_dict.get("gmail_label", ""))`
   - `linear_project` → `str(entry_dict.get("linear_project", ""))`
   - `every_30min` key in `raw_schedule` is already handled by `FloorSchedule(**raw_schedule)`
4. Write tests covering:
   - `FloorSchedule` with `every_30min` field (populated + default)
   - `FloorConfig` with new fields (populated + default)
   - `load_building_config` parsing TOML with new fields
   - Backward compatibility: existing floors without new fields still parse correctly

**Success criteria:**
- SC-1, SC-2, SC-3 from SPEC pass
- `cd backend && uv run pytest tests/test_floor_config_cs_fields.py -v` passes
- `cd backend && uv run pytest tests/test_floor_config_new_fields.py -v` passes (no regression)

---

## T2 — Scheduler every_30min support ⬜

**Depends on:** T1

**Goal:** Add `IntervalTrigger(minutes=30)` registration in `FloorScheduler._register_jobs` for `floor.schedule.every_30min` tasks.

**Files to modify:**
- `backend/app/core/scheduler.py`

**Files to create/extend:**
- `backend/tests/test_scheduler_interval.py` (new test file)

**Steps:**
1. Import `IntervalTrigger` from `apscheduler.triggers.interval`
2. In `_register_jobs`, after the daily/weekly loops, add a loop for `floor.schedule.every_30min`:
   ```python
   for task in floor.schedule.every_30min:
       self._scheduler.add_job(
           self._trigger_task,
           IntervalTrigger(minutes=30),
           args=[floor.id, task, floor.mission, floor.workdocs_dir],
           id=f"{floor.id}__every_30min__{self._job_count}",
       )
       self._job_count += 1
   ```
3. Write tests:
   - A floor with `every_30min` tasks registers the correct number of jobs
   - `IntervalTrigger` is used (not `CronTrigger`) for these jobs
   - A floor with no `every_30min` tasks registers zero interval jobs
   - Mixed schedule (daily + weekly + every_30min) counts all jobs correctly

**Success criteria:**
- SC-4 from SPEC passes
- `cd backend && uv run pytest tests/test_scheduler_interval.py -v` passes
- Existing scheduler tests (if any) still pass

---

## T3 — floors.toml + boss prompt ⬜

**Depends on:** T1

**Goal:** Update `customer_service` entry in `floors.toml` with new fields and rewrite the boss prompt for email processing.

**Files to modify:**
- `backend/floors.toml`
- `backend/prompts/customer_service_boss.md`

**Steps:**
1. Replace the `customer_service` entry in `floors.toml` with the spec from the design doc (see SPEC "floors.toml update" section)
2. Rewrite `backend/prompts/customer_service_boss.md` with:
   - Floor identity: "Jefe autónomo de Customer Service de Prometeo"
   - Inbox: `prometeo@tesseron.cl`
   - Gmail label: `cs-procesado`
   - Linear project: `Prometeo`
   - Vault path: `vault/customer_service/`
   - 4 classification rules with detailed action instructions
   - Bug: create Linear ticket + reply (request missing info if insufficient)
   - Consulta: read vault notes with `Read` tool, compose knowledge-based reply
   - Feature request: standard acknowledgment
   - Spam: no action, no reply
   - 3 mandatory post-processing steps (workdoc + Gmail label + update POST)
   - Update priority rules (critical/alert/info)
   - Workdoc format template
   - Language: match the client's language
3. Fix any downstream tests that hardcode customer_service floor expectations (check `test_trigger_endpoint.py` — it uses `dev_software` and `mkt_ventas`, not CS, so likely no changes needed)

**Success criteria:**
- SC-5 from SPEC passes (floors.toml parses correctly)
- SC-7 from SPEC passes (boss prompt contains classification rules)
- `cd backend && uv run pytest tests/test_trigger_endpoint.py -v` passes (no regression)

---

## T4 — Obsidian vault structure ⬜

**Depends on:** —

**Goal:** Create the Obsidian vault folder structure under `vault/customer_service/` with placeholder markdown notes.

**Files to create:**
- `vault/customer_service/.obsidian/app.json`
- `vault/customer_service/producto/que-es-prometeo.md`
- `vault/customer_service/producto/funcionalidades.md`
- `vault/customer_service/producto/roadmap-publico.md`
- `vault/customer_service/precios/planes.md`
- `vault/customer_service/precios/faq-precios.md`
- `vault/customer_service/soporte/bugs-conocidos.md`
- `vault/customer_service/soporte/como-reportar.md`
- `vault/customer_service/soporte/tiempos-respuesta.md`
- `vault/customer_service/empresa/mision-vision.md`
- `vault/customer_service/empresa/contacto.md`

**Steps:**
1. Create directory structure
2. Create `.obsidian/app.json` with minimal Obsidian config
3. Create each markdown note with:
   - Title (H1)
   - Brief description of what the note should contain
   - `[TODO: ...]` markers where humans should fill in real content
4. Remove the existing `.gitkeep` if it exists (the new files make it unnecessary)

**Success criteria:**
- SC-6 from SPEC passes (all directories and files exist)
- Each `.md` file is non-empty and contains a title and TODO markers
- `.obsidian/app.json` is valid JSON

---

## T5 — Integration validation ⬜

**Depends on:** T1, T2, T3, T4

**Goal:** Verify the full CS floor setup works end-to-end and all existing tests pass.

**Steps:**
1. Run `cd backend && uv run pytest --tb=short -q` — all tests must pass
2. Run SC-1 through SC-8 from SPEC — all must pass
3. Run `make checkall` from project root — must pass
4. Verify `floors.toml` loads without errors in the running app (start dev server, hit `GET /api/v1/floors`, verify CS floor appears with correct fields)
5. Fix any issues found

**Success criteria:**
- SC-8 from SPEC passes (all pytest tests pass)
- `make checkall` passes
- `GET /api/v1/floors` returns CS floor with `inbox_email`, `gmail_label`, `linear_project`, `knowledge_vault` fields
