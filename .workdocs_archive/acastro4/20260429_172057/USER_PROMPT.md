# User Prompt

The user is building the Ralph × Panoptica merger. Panoptica is being reoriented around Ralph runs (multiple concurrent Ralph runs rendered as private offices on a coworking-space campus view; ad-hoc Claude sessions live as hot-desks).

This run executes **Plan 1 — Backend** of **Spec A (Run visualizer)**.

**Scope:** Backend only. Extend the Pydantic models with Run/Role/PlanTask types, add a marker-file reader, PLAN.md parser, session tagger, in-memory Run aggregator, marker-file watcher, PLAN.md watcher, wire them into the existing `session_start`/`session_end` handlers and the FastAPI lifecycle, add hook-side `RALPH_*` env forwarding, and finish with an end-to-end smoke test.

**Out of scope for this run (explicit):** Frontend (Plan 2). Ralph-plugin instrumentation edits (Plan 3). Token/cost rendering (Spec B). Linear wizard (Spec C). Replay UI.

**Contract:**
- SPEC: `workdocs/SPEC.md` (full Spec A design doc).
- PLAN: `workdocs/PLAN.md` (slim task list; each task maps 1:1 to a section in the detailed plan doc at `docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md`).
- Feature branch: `feature/ralph-panoptica-spec-a`. Target branch: `main`.
- Primary repo: `panoptica`.
