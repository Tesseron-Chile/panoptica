"""Tests for the floor updates API (T2)."""

from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta

import httpx
import pytest_asyncio
from httpx import ASGITransport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import FloorUpdateRecord
from app.main import app


@pytest_asyncio.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


async def test_create_floor_update(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/floors/floor_a/updates",
        json={"priority": "info", "title": "Test update", "body": "Details here"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["id"], int)
    assert data["floorId"] == "floor_a"
    assert data["priority"] == "info"
    assert data["title"] == "Test update"
    assert data["body"] == "Details here"
    assert data["autoExpireHours"] == 24
    assert data["resolved"] is False
    assert "timestamp" in data


async def test_create_floor_update_custom_expiry(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/floors/floor_b/updates",
        json={"priority": "alert", "title": "Alert", "body": "Alert body", "autoExpireHours": 48},
    )
    assert resp.status_code == 200
    assert resp.json()["autoExpireHours"] == 48


async def test_create_floor_update_invalid_priority(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/floors/floor_a/updates",
        json={"priority": "urgent", "title": "Bad", "body": "Bad body"},
    )
    assert resp.status_code == 422


async def test_get_floor_updates_floor_filter(client: httpx.AsyncClient) -> None:
    await client.post(
        "/api/v1/floors/floor_filter_x/updates",
        json={"priority": "info", "title": "X update", "body": "X body"},
    )
    await client.post(
        "/api/v1/floors/floor_filter_y/updates",
        json={"priority": "info", "title": "Y update", "body": "Y body"},
    )
    resp = await client.get("/api/v1/floors/floor_filter_x/updates")
    assert resp.status_code == 200
    updates = resp.json()
    assert len(updates) >= 1
    assert all(u["floorId"] == "floor_filter_x" for u in updates)


async def test_get_floor_updates_priority_filter(client: httpx.AsyncClient) -> None:
    await client.post(
        "/api/v1/floors/floor_pri/updates",
        json={"priority": "critical", "title": "Critical one", "body": "body"},
    )
    await client.post(
        "/api/v1/floors/floor_pri/updates",
        json={"priority": "info", "title": "Info one", "body": "body"},
    )
    resp = await client.get("/api/v1/floors/floor_pri/updates?priority=critical")
    assert resp.status_code == 200
    updates = resp.json()
    assert len(updates) >= 1
    assert all(u["priority"] == "critical" for u in updates)


async def test_get_floor_updates_empty_floor(client: httpx.AsyncClient) -> None:
    resp = await client.get("/api/v1/floors/nonexistent_xyz_floor/updates")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_patch_floor_update_resolve(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/floors/floor_patch/updates",
        json={"priority": "alert", "title": "To resolve", "body": "body"},
    )
    update_id = resp.json()["id"]

    patch_resp = await client.patch(f"/api/v1/updates/{update_id}", json={"resolved": True})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["resolved"] is True
    assert patch_resp.json()["id"] == update_id


async def test_patch_floor_update_unresolve(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/floors/floor_unresolve/updates",
        json={"priority": "alert", "title": "Toggle", "body": "body"},
    )
    update_id = resp.json()["id"]

    await client.patch(f"/api/v1/updates/{update_id}", json={"resolved": True})
    patch_resp = await client.patch(f"/api/v1/updates/{update_id}", json={"resolved": False})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["resolved"] is False


async def test_patch_floor_update_not_found(client: httpx.AsyncClient) -> None:
    resp = await client.patch("/api/v1/updates/99999999", json={"resolved": True})
    assert resp.status_code == 404


async def test_get_latest_updates_sorted_by_priority(client: httpx.AsyncClient) -> None:
    await client.post(
        "/api/v1/floors/floor_latest_a/updates",
        json={"priority": "report", "title": "Report", "body": "body"},
    )
    await client.post(
        "/api/v1/floors/floor_latest_b/updates",
        json={"priority": "critical", "title": "Critical", "body": "body"},
    )
    await client.post(
        "/api/v1/floors/floor_latest_c/updates",
        json={"priority": "alert", "title": "Alert", "body": "body"},
    )

    resp = await client.get("/api/v1/updates/latest?limit=10")
    assert resp.status_code == 200
    updates = resp.json()
    assert len(updates) >= 3

    priority_order = {"critical": 0, "alert": 1, "info": 2, "report": 3}
    ranks = [priority_order[u["priority"]] for u in updates]
    assert ranks == sorted(ranks)


async def test_get_latest_updates_limit(client: httpx.AsyncClient) -> None:
    for i in range(5):
        await client.post(
            "/api/v1/floors/floor_limit_latest/updates",
            json={"priority": "info", "title": f"Update {i}", "body": "body"},
        )
    resp = await client.get("/api/v1/updates/latest?limit=3")
    assert resp.status_code == 200
    assert len(resp.json()) <= 3


async def test_expiry_excludes_non_critical(db_session: AsyncSession) -> None:
    expired_record = FloorUpdateRecord(
        floor_id="floor_expiry_test",
        priority="info",
        title="Expired",
        body="This is expired",
        timestamp=datetime.now(UTC) - timedelta(hours=48),
        auto_expire_hours=24,
    )
    active_record = FloorUpdateRecord(
        floor_id="floor_expiry_test",
        priority="info",
        title="Active",
        body="This is active",
        auto_expire_hours=24,
    )
    db_session.add(expired_record)
    db_session.add(active_record)
    await db_session.commit()

    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/v1/floors/floor_expiry_test/updates")
    assert resp.status_code == 200
    updates = resp.json()
    titles = [u["title"] for u in updates]
    assert "Active" in titles
    assert "Expired" not in titles


async def test_expiry_include_expired_shows_all(db_session: AsyncSession) -> None:
    expired_record = FloorUpdateRecord(
        floor_id="floor_inc_expired",
        priority="alert",
        title="Old alert",
        body="expired body",
        timestamp=datetime.now(UTC) - timedelta(hours=72),
        auto_expire_hours=24,
    )
    db_session.add(expired_record)
    await db_session.commit()

    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/v1/floors/floor_inc_expired/updates?include_expired=true")
    assert resp.status_code == 200
    updates = resp.json()
    titles = [u["title"] for u in updates]
    assert "Old alert" in titles


async def test_critical_never_expires(db_session: AsyncSession) -> None:
    critical_record = FloorUpdateRecord(
        floor_id="floor_critical_expiry",
        priority="critical",
        title="Very old critical",
        body="body",
        timestamp=datetime.now(UTC) - timedelta(hours=9999),
        auto_expire_hours=1,
    )
    db_session.add(critical_record)
    await db_session.commit()

    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/v1/floors/floor_critical_expiry/updates")
    assert resp.status_code == 200
    updates = resp.json()
    titles = [u["title"] for u in updates]
    assert "Very old critical" in titles


async def test_floor_update_db_direct(db_session: AsyncSession) -> None:
    record = FloorUpdateRecord(
        floor_id="floor_db_direct",
        priority="report",
        title="DB direct test",
        body="body content",
    )
    db_session.add(record)
    await db_session.commit()
    await db_session.refresh(record)

    assert record.id is not None
    assert record.floor_id == "floor_db_direct"
    assert record.priority == "report"
    assert record.title == "DB direct test"
    assert record.resolved is False
    assert record.auto_expire_hours == 24
    assert record.timestamp is not None

    result = await db_session.execute(
        select(FloorUpdateRecord).where(FloorUpdateRecord.id == record.id)
    )
    fetched = result.scalar_one()
    assert fetched.floor_id == "floor_db_direct"
