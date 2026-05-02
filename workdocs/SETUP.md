# SETUP — Customer Service Floor

## Project-Specific Tooling

### Backend

All required dependencies are already installed. No new packages needed.

**Key imports to verify work:**
```bash
cd backend && uv run python3 -c "
from apscheduler.triggers.interval import IntervalTrigger
from app.core.floor_config import FloorConfig, FloorSchedule, load_building_config
from app.core.scheduler import FloorScheduler
from app.core.agent_runner import AgentRunner
print('All imports OK')
"
```

### Running Tests

```bash
# All backend tests
cd backend && uv run pytest --tb=short -q

# Specific test file
cd backend && uv run pytest tests/test_floor_config_cs_fields.py -v

# Full project checks
make checkall   # from project root
```

### Dev Server

```bash
make dev-tmux   # starts backend :8000 + frontend :3000
```

Verify CS floor loads: `curl -s http://localhost:8000/api/v1/floors | python3 -m json.tool | grep customer_service`

### No External Services Required

- Gmail MCP and Linear MCP are runtime dependencies (available in Claude sessions, not in dev/test).
- No API keys or secrets needed for development or testing.
- Tests use mocks for `AgentRunner` and scheduler.
