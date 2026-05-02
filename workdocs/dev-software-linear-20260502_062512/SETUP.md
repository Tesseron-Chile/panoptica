# SETUP — Linear-Driven dev_software Floor

## Project Structure

Working directory: `/tmp/panoptica-dev-software` (git worktree on `ralph/df5874d1`)
Primary repo reference: `/Users/albertocastrobravo/Documents/MJM/panoptica` (read-only — do NOT modify)

## Required Tools

| Tool | Purpose | Verify |
|------|---------|--------|
| `uv` | Python package manager / runner | `uv --version` |
| `python3` | Python 3.11+ with `tomllib` | `python3 -c "import tomllib; print('ok')"` |
| `rg` | ripgrep for success criteria checks | `rg --version` |

## Backend Setup

```bash
cd /tmp/panoptica-dev-software/backend
uv sync
```

Verify import works:
```bash
uv run python -c "import app.core.agent_runner; print('ok')"
```

## Running Tests

```bash
cd /tmp/panoptica-dev-software/backend
uv run pytest tests/test_agent_runner.py -v
```

If `test_agent_runner.py` doesn't exist yet, create it as part of T6.

## TOML Validation

```bash
python3 -c "
import tomllib
with open('/tmp/panoptica-dev-software/backend/floors.toml', 'rb') as f:
    config = tomllib.load(f)
print(f'{len(config[\"floors\"])} floors loaded')
"
```

## Notes

- Linear MCP tools (`mcp__plugin_linear_linear__*`) are not testable offline — they require a live Claude session with MCP configured. Success criteria for prompt content use pattern matching (rg), not runtime execution.
- Chrome MCP tools (`mcp__claude-in-chrome__*`) similarly require a live browser session — not testable in this workflow.
- No external services or API keys needed for implementation and testing. The prompts reference MCP tools that are available at Claude runtime, not at dev time.
