"""Tests for C-Level proposals API (C-3)."""

from collections.abc import AsyncIterator
from pathlib import Path
from unittest.mock import patch

import httpx
import pytest
import pytest_asyncio
from httpx import ASGITransport

from app.main import app


@pytest_asyncio.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
def proposals_dir(tmp_path: Path) -> Path:
    d = tmp_path / "propuestas"
    d.mkdir()
    return d


async def test_get_proposals_empty(client: httpx.AsyncClient, tmp_path: Path) -> None:
    empty_dir = tmp_path / "propuestas_empty"
    with patch("app.api.routes.clevel._PROPOSALS_DIR", empty_dir):
        resp = await client.get("/api/v1/floors/c_level/proposals")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_proposals_returns_files(
    client: httpx.AsyncClient, proposals_dir: Path
) -> None:
    (proposals_dir / "2026-05-01-mejorar-scheduler.md").write_text(
        "# Mejorar scheduler de tareas\n\nPropuesta detallada...", encoding="utf-8"
    )
    with patch("app.api.routes.clevel._PROPOSALS_DIR", proposals_dir):
        resp = await client.get("/api/v1/floors/c_level/proposals")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["filename"] == "2026-05-01-mejorar-scheduler.md"
    assert data[0]["title"] == "Mejorar scheduler de tareas"
    assert "Propuesta detallada" in data[0]["content"]
    assert "createdAt" in data[0]


async def test_reject_proposal_deletes_file(
    client: httpx.AsyncClient, proposals_dir: Path
) -> None:
    f = proposals_dir / "2026-05-01-test.md"
    f.write_text("# Test proposal", encoding="utf-8")
    with patch("app.api.routes.clevel._PROPOSALS_DIR", proposals_dir):
        resp = await client.delete("/api/v1/floors/c_level/proposals/2026-05-01-test.md")
    assert resp.status_code == 204
    assert not f.exists()


async def test_reject_proposal_not_found(
    client: httpx.AsyncClient, proposals_dir: Path
) -> None:
    with patch("app.api.routes.clevel._PROPOSALS_DIR", proposals_dir):
        resp = await client.delete("/api/v1/floors/c_level/proposals/nonexistent.md")
    assert resp.status_code == 404


async def test_reject_proposal_rejects_path_traversal(client: httpx.AsyncClient) -> None:
    resp = await client.delete("/api/v1/floors/c_level/proposals/..%2Fsome-file.md")
    assert resp.status_code in (400, 404, 422)
