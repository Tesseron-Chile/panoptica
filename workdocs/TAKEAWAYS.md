# Takeaways

Ongoing log of learnings, deviations, broken assumptions, and workflow observations.

## Run setup notes

- **Phase A done out-of-band.** SPEC and PLAN were authored in a prior brainstorming + writing-plans session and committed before Ralph was invoked. Designer agent was not spawned.
- **Branch naming deviation.** Feature branch is `feature/ralph-panoptica-spec-a`, not the standard `ralph/<uuid>`. User's explicit choice — kept because it already holds the approved SPEC commit.
- **Plan doc location.** The full detailed plan (with code + tests per task) lives at `docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md`. `workdocs/PLAN.md` is a slim task-list pointing to it. Coders must read the matching task section in the plan doc before starting.
- **Task 12 touches `hooks/`.** Not `backend/`. Coder for that task must operate in `hooks/`.

## Learnings

- **`model_config` collision in Pydantic v2:** `Run.model_config` is a reserved Pydantic class attribute for `ConfigDict`. The field holding Ralph's per-role model strings must be named `model_config_` with `Field(alias="modelConfig")`. Tests must use the Python name `model_config_=...` as the kwarg. JSON round-trips as `modelConfig` correctly. Plan doc called this out and the approach works.
- **`git add` from a subdirectory:** Running `uv run pytest` from `backend/` sets the shell CWD there. Subsequent bare `git add` calls must be run from repo root (or use `git -C <repo_root>`), otherwise git misinterprets relative paths.
- **Pyright false positive on `list[PlanTask]`:** With `from __future__ import annotations`, Pyright reports `plan_tasks` as `list[Unknown]`. This is a static-analysis artifact — runtime and tests are correct. Not worth working around; no functional impact.
