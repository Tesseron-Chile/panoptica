# Project Setup — Panoptica Backend

Minimum setup needed for coder agents working on Plan 1 (backend implementation for Spec A).

## Repository

- Primary repo: `panoptica`
- Feature branch: `feature/ralph-panoptica-spec-a`
- Working directory: `/Users/m.cadilecaceres/dev/tesseron/panoptica`

## Python / backend

The backend lives in `backend/`. It uses `uv` for dependency management.

Verify:

```bash
cd backend && uv --version && uv run python --version
```

Install deps (first run only):

```bash
cd backend && uv sync
```

Run the test suite:

```bash
cd backend && uv run pytest tests/ -q
```

Run a single test file:

```bash
cd backend && uv run pytest tests/test_models_runs.py -v
```

## Hooks (Task 12 only)

Task 12 modifies `hooks/`:

```bash
cd hooks && uv run pytest -q
```

## Repo-wide check

From repo root:

```bash
make checkall
```

This runs lint, typecheck, and tests across backend + frontend + hooks. Expected green before any task's ✅ commit.

## Key project conventions (from `CLAUDE.md`)

- Pydantic models use `ConfigDict(alias_generator=to_camel, populate_by_name=True)`. New types must follow.
- Tests live under `backend/tests/`. Naming: `test_<module>.py`.
- Commit after every logical unit of work.
- Existing poller pattern is `backend/app/core/beads_poller.py` — reuse its shape for new watchers.

## Plan reference

Every Phase B task corresponds 1:1 to a task in the full plan at:

```
docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md
```

That file contains exact file paths, test code, implementation code, and commit messages. The coder must read the matching task section there before starting.
