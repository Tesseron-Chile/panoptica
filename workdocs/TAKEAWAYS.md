# Takeaways

## Phase A Design Decisions

- Run A-1 implements backend infrastructure only — no frontend, no WebSocket changes
- CLAUDE_OFFICE_FLOOR_ID is the key routing mechanism: AgentRunner injects it into env, existing hooks propagate it, backend routes events to correct floor
- APScheduler 3.x with AsyncIOScheduler chosen (runs on existing FastAPI event loop, no extra threads)
- fire-and-forget subprocess model: AgentRunner does not await agent completion (hooks handle the feedback loop)
- FloorScheduler skips floors with is_c_level=True (C-Level has no autonomous scheduled tasks)
- EventData.floor_id already exists in backend/app/models/events.py — no model change needed for hooks integration
- floors.toml replaces Tesseron products with Prometeo departments — breaking change to building config, but no running services depend on specific floor IDs

## Known Issues

- Local main is 1 commit ahead of origin/main (spec doc commit from brainstorming). Need to push main before creating PR in Phase C.
- Plan is at docs/superpowers/plans/ not workdocs/ — coder agents should use workdocs/PLAN.md

## Workflow Notes

- Design was done in a prior brainstorming session and approved by user — designer agent adapted existing docs rather than discovering from scratch
