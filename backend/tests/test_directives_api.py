"""Tests for C-Level directives API."""

from collections.abc import AsyncIterator
from unittest.mock import AsyncMock, patch

import httpx
import pytest
import pytest_asyncio
from httpx import ASGITransport

from app.main import app


@pytest_asyncio.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_get_directives_empty(client: httpx.AsyncClient) -> None:
    resp = await client.get("/api/v1/floors/c_level/directives")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_trigger_arquitecto(client: httpx.AsyncClient) -> None:
    with patch(
        "app.api.routes.clevel._arquitecto.run_observation_cycle",
        new_callable=AsyncMock,
    ):
        resp = await client.post("/api/v1/floors/c_level/arquitecto/trigger")
    assert resp.status_code == 202
    data = resp.json()
    assert data["status"] == "launched"
    assert "triggered_at" in data


@pytest.mark.parametrize(
    "floor_id,instruction",
    [
        ("dev_software", "revisa el backlog urgente"),
        ("financiero", "genera reporte de cierre"),
    ],
)
async def test_directive_created_via_chat(
    client: httpx.AsyncClient, floor_id: str, instruction: str
) -> None:
    with patch(
        "app.api.routes.chat._runner.run_floor_task",
        new_callable=AsyncMock,
    ):
        resp = await client.post(
            "/api/v1/floors/c_level/chat",
            json={"sender": "jefe", "role": "user", "content": f"@{floor_id}: {instruction}"},
        )
    assert resp.status_code == 200

    directives_resp = await client.get("/api/v1/floors/c_level/directives")
    assert directives_resp.status_code == 200
    directives = directives_resp.json()
    matching = [
        d for d in directives if d["floorId"] == floor_id and d["instruction"] == instruction
    ]
    assert len(matching) >= 1
    assert matching[0]["status"] == "triggered"


async def test_unknown_floor_directive_posts_warning(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/floors/c_level/chat",
        json={"sender": "jefe", "role": "user", "content": "@piso_fantasma: tarea inexistente"},
    )
    assert resp.status_code == 200

    msgs_resp = await client.get("/api/v1/floors/c_level/chat")
    assert msgs_resp.status_code == 200
    messages = msgs_resp.json()
    warning_msgs = [m for m in messages if "piso_fantasma" in m["content"] and "⚠" in m["content"]]
    assert len(warning_msgs) >= 1
