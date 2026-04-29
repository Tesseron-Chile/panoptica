"""Tests for the chat message API (T1)."""

from collections.abc import AsyncIterator

import httpx
import pytest
import pytest_asyncio
from httpx import ASGITransport
from sqlalchemy import select

from app.db.models import ChatMessageRecord
from app.main import app


@pytest_asyncio.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


async def test_create_chat_message(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/floors/floor_a/chat",
        json={"sender": "alice", "role": "user", "content": "hello"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["id"], int)
    assert data["floorId"] == "floor_a"
    assert data["sender"] == "alice"
    assert data["role"] == "user"
    assert data["content"] == "hello"
    assert "timestamp" in data


async def test_create_chat_message_agent_role(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/floors/floor_b/chat",
        json={"sender": "claude", "role": "agent", "content": "I can help"},
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "agent"


async def test_create_chat_message_system_role(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/floors/floor_b/chat",
        json={"sender": "system", "role": "system", "content": "Session started"},
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "system"


async def test_get_chat_messages_floor_filter(client: httpx.AsyncClient) -> None:
    await client.post(
        "/api/v1/floors/floor_filter_x/chat",
        json={"sender": "a", "role": "user", "content": "msg x"},
    )
    await client.post(
        "/api/v1/floors/floor_filter_y/chat",
        json={"sender": "b", "role": "agent", "content": "msg y"},
    )
    resp = await client.get("/api/v1/floors/floor_filter_x/chat")
    assert resp.status_code == 200
    messages = resp.json()
    assert len(messages) >= 1
    assert all(m["floorId"] == "floor_filter_x" for m in messages)


async def test_get_chat_messages_newest_first(client: httpx.AsyncClient) -> None:
    for i in range(3):
        await client.post(
            "/api/v1/floors/floor_ordered/chat",
            json={"sender": "user", "role": "user", "content": f"msg {i}"},
        )
    resp = await client.get("/api/v1/floors/floor_ordered/chat")
    assert resp.status_code == 200
    messages = resp.json()
    assert len(messages) >= 3
    ids = [m["id"] for m in messages]
    assert ids == sorted(ids, reverse=True)


async def test_get_chat_messages_limit(client: httpx.AsyncClient) -> None:
    for i in range(10):
        await client.post(
            "/api/v1/floors/floor_limit/chat",
            json={"sender": "user", "role": "user", "content": f"msg {i}"},
        )
    resp = await client.get("/api/v1/floors/floor_limit/chat?limit=5")
    assert resp.status_code == 200
    messages = resp.json()
    assert len(messages) <= 5


async def test_get_chat_messages_before_cursor(client: httpx.AsyncClient) -> None:
    ids = []
    for i in range(5):
        resp = await client.post(
            "/api/v1/floors/floor_cursor/chat",
            json={"sender": "user", "role": "user", "content": f"msg {i}"},
        )
        ids.append(resp.json()["id"])

    cutoff = ids[3]
    resp = await client.get(f"/api/v1/floors/floor_cursor/chat?before={cutoff}")
    assert resp.status_code == 200
    messages = resp.json()
    assert all(m["id"] < cutoff for m in messages)


async def test_get_chat_messages_empty_floor(client: httpx.AsyncClient) -> None:
    resp = await client.get("/api/v1/floors/floor_nonexistent_xyz/chat")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_chat_message_invalid_role(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/floors/floor_a/chat",
        json={"sender": "alice", "role": "invalid_role", "content": "hello"},
    )
    assert resp.status_code == 422


async def test_chat_message_db_direct(db_session: pytest.FixtureRequest) -> None:
    record = ChatMessageRecord(
        floor_id="floor_db",
        sender="test_sender",
        role="system",
        content="direct db test",
    )
    db_session.add(record)
    await db_session.commit()
    await db_session.refresh(record)

    assert record.id is not None
    assert record.floor_id == "floor_db"
    assert record.sender == "test_sender"
    assert record.role == "system"
    assert record.content == "direct db test"
    assert record.timestamp is not None

    result = await db_session.execute(
        select(ChatMessageRecord).where(ChatMessageRecord.id == record.id)
    )
    fetched = result.scalar_one()
    assert fetched.floor_id == "floor_db"
