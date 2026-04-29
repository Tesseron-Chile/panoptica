"""Tests that CLAUDE_OFFICE_FLOOR_ID env var is picked up by the event mapper."""

import os
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from claude_office_hooks.event_mapper import map_event

# map_event signature: (event_type, raw_data, session_id, strip_prefixes=None) -> dict | None
MINIMAL_RAW = {
    "session_id": "test-session-123",
    "transcript_path": "/home/user/.claude/projects/my-project/session.jsonl",
}


def test_floor_id_included_when_env_set():
    with patch.dict(os.environ, {"CLAUDE_OFFICE_FLOOR_ID": "dev_software"}):
        event = map_event("session_start", MINIMAL_RAW, "test-session-123")
    assert event is not None
    assert event["data"]["floor_id"] == "dev_software"


def test_floor_id_absent_when_env_not_set():
    env = {k: v for k, v in os.environ.items() if k != "CLAUDE_OFFICE_FLOOR_ID"}
    with patch.dict(os.environ, env, clear=True):
        event = map_event("session_start", MINIMAL_RAW, "test-session-123")
    assert event is not None
    assert "floor_id" not in event["data"]
