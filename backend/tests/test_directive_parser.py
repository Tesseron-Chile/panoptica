"""Unit tests for the directive parser."""

import pytest

from app.core.directive_parser import Directive, parse_directive


@pytest.mark.parametrize(
    "content,expected_floor,expected_instruction",
    [
        ("@dev_software: revisa el backlog", "dev_software", "revisa el backlog"),
        ("@financiero: genera reporte mensual", "financiero", "genera reporte mensual"),
        ("@mkt_ventas: analiza pipeline Q2", "mkt_ventas", "analiza pipeline Q2"),
        ("@c_level: resumen ejecutivo", "c_level", "resumen ejecutivo"),
        (
            "@dev_hardware: revisa BOM de componentes críticos\ny documenta en vault",
            "dev_hardware",
            "revisa BOM de componentes críticos\ny documenta en vault",
        ),
    ],
)
def test_parse_directive_valid(
    content: str, expected_floor: str, expected_instruction: str
) -> None:
    result = parse_directive(content)
    assert result is not None
    assert result.floor_id == expected_floor
    assert result.instruction == expected_instruction


def test_parse_directive_strips_whitespace() -> None:
    result = parse_directive("  @dev_software:   haz algo   ")
    assert result is not None
    assert result.instruction == "haz algo"


@pytest.mark.parametrize(
    "content",
    [
        "hola mundo",
        "sin arroba: instruccion",
        "@: instruccion sin floor",
        "@1floor: numeros al inicio no permitidos",
        "texto previo @dev_software: instruccion",
        "",
        "  ",
    ],
)
def test_parse_directive_invalid(content: str) -> None:
    assert parse_directive(content) is None


def test_directive_slots() -> None:
    d = Directive(floor_id="test", instruction="do something")
    assert d.floor_id == "test"
    assert d.instruction == "do something"
