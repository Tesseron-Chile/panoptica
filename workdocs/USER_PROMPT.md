# User Prompt — Run A-2

**Trigger:** User said "Arranquemos con A-2" after Run A-1 was merged into the `prometeo` branch.

**Context:** This is a chained Ralph run. Run A-1 is complete and merged into `prometeo`.

## Request

Implement Run A-2: Chat API + Updates Board, as defined in `docs/superpowers/specs/2026-04-28-prometeo-company-os-design.md` (section "Run A-2: Chat API + Updates Board"):

- Tabla `chat_messages` en SQLite + endpoints REST + WebSocket broadcast
- `FloorUpdate` model + tabla `floor_updates` + endpoints
- Modo 12 del whiteboard (updates board)
- Updates bar en `BuildingView`
- Tests: CRUD de mensajes, broadcast de updates, filtros por prioridad

## Variables

- `target_branch` = `prometeo`
- Branch base: `prometeo` (has Run A-1 merged)
- Repo: `Tesseron-Chile/panoptica`
- Design is pre-approved — designer should read the design doc and write SPEC/PLAN without user interview
- User explicitly skipped the design interview: "No se necesita entrevistar al usuario"
