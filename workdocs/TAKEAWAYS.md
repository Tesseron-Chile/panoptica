# Takeaways

Ongoing log of learnings, deviations, broken assumptions, and workflow observations.

## Run setup notes

- **Phase A done out-of-band.** SPEC and PLAN were authored in a prior brainstorming + writing-plans session and committed before Ralph was invoked. Designer agent was not spawned.
- **Branch naming deviation.** Feature branch is `feature/ralph-panoptica-spec-a`, not the standard `ralph/<uuid>`. User's explicit choice — kept because it already holds the approved SPEC commit.
- **Plan doc location.** The full detailed plan (with code + tests per task) lives at `docs/superpowers/plans/2026-04-18-ralph-panoptica-backend.md`. `workdocs/PLAN.md` is a slim task-list pointing to it. Coders must read the matching task section in the plan doc before starting.
- **Task 12 touches `hooks/`.** Not `backend/`. Coder for that task must operate in `hooks/`.

## Learnings
