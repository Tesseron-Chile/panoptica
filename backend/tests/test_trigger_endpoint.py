"""Tests for POST /floors/{floor_id}/tasks/trigger endpoint."""

from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_trigger_known_floor_default_task():
    with patch("app.api.routes.floors._runner.run_floor_task", new_callable=AsyncMock) as mock_run:
        response = client.post("/api/v1/floors/dev_software/tasks/trigger")

    assert response.status_code == 202
    body = response.json()
    assert body["floor_id"] == "dev_software"
    assert "task" in body
    assert "triggered_at" in body
    mock_run.assert_called_once()
    call_kwargs = mock_run.call_args.kwargs
    assert call_kwargs["floor_id"] == "dev_software"


def test_trigger_known_floor_custom_task():
    with patch("app.api.routes.floors._runner.run_floor_task", new_callable=AsyncMock) as mock_run:
        response = client.post(
            "/api/v1/floors/dev_software/tasks/trigger",
            json={"task": "custom tarea de prueba"},
        )

    assert response.status_code == 202
    body = response.json()
    assert body["task"] == "custom tarea de prueba"
    call_kwargs = mock_run.call_args.kwargs
    assert call_kwargs["task"] == "custom tarea de prueba"


def test_trigger_unknown_floor_returns_404():
    response = client.post("/api/v1/floors/floor_inexistente/tasks/trigger")
    assert response.status_code == 404


def test_trigger_returns_floor_id_and_timestamp():
    with patch("app.api.routes.floors._runner.run_floor_task", new_callable=AsyncMock):
        response = client.post("/api/v1/floors/mkt_ventas/tasks/trigger")

    assert response.status_code == 202
    body = response.json()
    assert body["floor_id"] == "mkt_ventas"
    # triggered_at should be a valid ISO timestamp
    assert "T" in body["triggered_at"]
