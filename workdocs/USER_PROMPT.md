# User Prompt — Run A-3

Run A-3: Frontend — Chat tab + Updates bar

El diseño ya está aprobado en docs/superpowers/specs/2026-04-28-prometeo-company-os-design.md (sección "Run A-3: Frontend — Chat tab + Updates bar"). No se necesita entrevistar al usuario — ir directo a Phase A con el designer usando el diseño existente.

Scope de Run A-3 (del design doc):
- Tab Chat en RightSidebar (consume POST/GET /api/v1/floors/{floor_id}/chat + WS /ws/floor/{floor_id})
- Updates bar en BuildingView (muestra 3 updates más urgentes via GET /api/v1/updates/latest)
- Whiteboard mode 12 — Updates Board (keyboard shortcut U, muestra lista de floor updates del piso activo)
- CLevelView básico (estado pisos + chat C-Level, reemplaza FloorView para el piso C-Level)

Branch base: prometeo (Run A-2 ya mergeado — backend APIs disponibles)
Target branch: prometeo
Repo: Tesseron-Chile/panoptica
Feature branch: ralph/1f8d21f2
