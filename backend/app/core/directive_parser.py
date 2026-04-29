"""DirectiveParser — extracts floor directives from C-Level chat messages.

Syntax: @floor_id: instruction
Example: @dev_software: revisar deuda técnica urgente
"""

from __future__ import annotations

import re

_DIRECTIVE_RE = re.compile(
    r"@(?P<floor_id>[a-z][a-z0-9_]{1,30}):\s*(?P<instruction>.+)",
    re.DOTALL,
)


class Directive:
    __slots__ = ("floor_id", "instruction")

    def __init__(self, floor_id: str, instruction: str) -> None:
        self.floor_id = floor_id
        self.instruction = instruction.strip()

    def __repr__(self) -> str:
        return f"Directive(floor_id={self.floor_id!r}, instruction={self.instruction!r})"


def parse_directive(content: str) -> Directive | None:
    """Return a Directive if content starts with @floor_id: syntax, else None."""
    m = _DIRECTIVE_RE.match(content.strip())
    if m is None:
        return None
    return Directive(floor_id=m.group("floor_id"), instruction=m.group("instruction"))
