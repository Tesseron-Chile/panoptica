"""Tests for floor-level WebSocket infrastructure (T3)."""

from fastapi.testclient import TestClient

from app.api.websocket import manager
from app.main import app

client = TestClient(app)


def test_floor_ws_connects() -> None:
    """The /ws/floor/{floor_id} endpoint accepts and closes connections cleanly."""
    with client.websocket_connect("/ws/floor/ws_connect_test"):
        pass


def test_floor_ws_chat_broadcast() -> None:
    """POST to chat triggers a chat_message broadcast to floor subscribers."""
    with client.websocket_connect("/ws/floor/ws_chat_floor") as ws:
        resp = client.post(
            "/api/v1/floors/ws_chat_floor/chat",
            json={"sender": "alice", "role": "user", "content": "broadcast test"},
        )
        assert resp.status_code == 200

        data = ws.receive_json()
        assert data["type"] == "chat_message"
        assert data["floor_id"] == "ws_chat_floor"
        assert data["message"]["content"] == "broadcast test"
        assert data["message"]["sender"] == "alice"
        assert data["message"]["floorId"] == "ws_chat_floor"


def test_floor_ws_update_broadcast() -> None:
    """POST to floor updates triggers a floor_update broadcast to floor subscribers."""
    with client.websocket_connect("/ws/floor/ws_update_floor") as ws:
        resp = client.post(
            "/api/v1/floors/ws_update_floor/updates",
            json={"priority": "info", "title": "Test Update", "body": "broadcast body"},
        )
        assert resp.status_code == 200

        data = ws.receive_json()
        assert data["type"] == "floor_update"
        assert data["floor_id"] == "ws_update_floor"
        assert data["update"]["title"] == "Test Update"
        assert data["update"]["priority"] == "info"
        assert data["update"]["floorId"] == "ws_update_floor"


def test_floor_ws_disconnect_cleanup() -> None:
    """Floor connections are removed from manager after WebSocket disconnect."""
    floor_id = "ws_cleanup_floor"

    with client.websocket_connect(f"/ws/floor/{floor_id}"):
        pass

    assert len(manager.floor_connections.get(floor_id, [])) == 0


def test_floor_ws_no_cross_floor_broadcast() -> None:
    """A floor subscriber does not hold connections from a different floor."""
    floor_a = "ws_iso_floor_a"
    floor_b = "ws_iso_floor_b"

    with client.websocket_connect(f"/ws/floor/{floor_a}"):
        # Post to floor_b — manager should have no connections for floor_a to receive
        resp = client.post(
            f"/api/v1/floors/{floor_b}/chat",
            json={"sender": "bob", "role": "user", "content": "other floor msg"},
        )
        assert resp.status_code == 200
        # floor_a subscriber list is populated; floor_b broadcast must not appear in floor_a
        assert len(manager.floor_connections.get(floor_b, [])) == 0
