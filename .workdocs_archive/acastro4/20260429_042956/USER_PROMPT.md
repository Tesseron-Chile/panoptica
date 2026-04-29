# User Prompt — Run A-1: Company OS Backend Infrastructure

## Original Request

Run A-1 of the Prometeo Company OS implementation. The user requested Ralph-structured execution of the plan at `docs/superpowers/plans/2026-04-28-company-os-run-a1.md`.

## Context from Brainstorming Session

The user (Alberto Castro, Prometeo/Tesseron) wants to transform panoptica from a passive Claude Code visualizer into an autonomous AI company OS for their product Prometeo (a MOM — Manufacturing Operating Manager).

**Run A-1 scope:** Backend infrastructure only:
- Add APScheduler dependency
- Extend FloorConfig with mission, workdocs_dir, schedule, is_c_level fields
- Replace floors.toml (Tesseron -> Prometeo with 6 departments)
- Propagate CLAUDE_OFFICE_FLOOR_ID env var through hooks -> backend events
- Implement AgentRunner (launches `claude -p` subprocesses per floor task)
- Implement FloorScheduler (APScheduler cron jobs per floor)
- Wire FloorScheduler into FastAPI lifespan

## Key Design Decisions

- CLAUDE_OFFICE_FLOOR_ID env var is the routing mechanism -- injected by AgentRunner, picked up by existing hooks, routes events to the correct floor in the visualizer
- No changes to PixiJS canvas, WebSocket, or existing hook logic -- only additions
- APScheduler 3.x with AsyncIOScheduler on the existing FastAPI event loop
- fire-and-forget subprocess model: AgentRunner does not await agent completion

## Spec and Plan

- Spec: docs/superpowers/specs/2026-04-28-prometeo-company-os-design.md
- Plan: docs/superpowers/plans/2026-04-28-company-os-run-a1.md

Both were reviewed and approved by the user during brainstorming.
