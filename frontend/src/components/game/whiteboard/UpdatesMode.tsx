"use client";

import { Graphics } from "pixi.js";
import { useState, useEffect } from "react";
import { type ReactNode } from "react";
import type { FloorUpdate } from "@/types";

const API_BASE = "http://localhost:8000/api/v1";
const ROW_H = 26;
const ROW_GAP = 3;
const MAX_ROWS = 6;
const BOARD_W = 310;

const PRIORITY_HEX: Record<FloorUpdate["priority"], number> = {
  critical: 0xef4444,
  alert: 0xf59e0b,
  info: 0x22c55e,
  report: 0x3b82f6,
};

interface UpdateRowProps {
  update: FloorUpdate;
  index: number;
}

function UpdateRow({ update, index }: UpdateRowProps): ReactNode {
  const y = index * (ROW_H + ROW_GAP);
  const dotColor = PRIORITY_HEX[update.priority];
  const title = update.title.slice(0, 32);

  return (
    <pixiContainer y={y}>
      {/* Row background */}
      <pixiGraphics
        draw={(g: Graphics) => {
          g.clear();
          g.roundRect(0, 0, BOARD_W, ROW_H, 3);
          g.fill({ color: 0x1e293b, alpha: 0.8 });
        }}
      />

      {/* Priority dot */}
      <pixiGraphics
        draw={(g: Graphics) => {
          g.clear();
          g.circle(10, ROW_H / 2, 4);
          g.fill(dotColor);
        }}
      />

      {/* Title */}
      <pixiText
        text={title}
        x={22}
        y={ROW_H / 2 - 5}
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 9,
          fill: "#e2e8f0",
        }}
        resolution={2}
      />

      {/* Priority label */}
      <pixiContainer x={BOARD_W - 4} y={ROW_H / 2} scale={0.5}>
        <pixiText
          text={update.priority.toUpperCase()}
          anchor={{ x: 1, y: 0.5 }}
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: 10,
            fill: `#${dotColor.toString(16).padStart(6, "0")}`,
          }}
          resolution={2}
        />
      </pixiContainer>
    </pixiContainer>
  );
}

interface UpdatesModeProps {
  floorId: string | null;
}

export function UpdatesMode({ floorId }: UpdatesModeProps): ReactNode {
  const [updates, setUpdates] = useState<FloorUpdate[]>([]);

  useEffect(() => {
    if (!floorId) return;
    let cancelled = false;
    fetch(`${API_BASE}/floors/${floorId}/updates?limit=6`)
      .then((r) => r.json())
      .then((data: FloorUpdate[]) => {
        if (!cancelled) setUpdates(data);
      })
      .catch(() => {/* ignore */});
    return () => {
      cancelled = true;
    };
  }, [floorId]);

  if (!floorId) {
    return (
      <pixiContainer x={165} y={50} scale={0.5}>
        <pixiText
          text="Navigate to a floor to see updates"
          anchor={0.5}
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: 18,
            fill: "#9ca3af",
          }}
          resolution={2}
        />
      </pixiContainer>
    );
  }

  if (updates.length === 0) {
    return (
      <pixiContainer x={165} y={50} scale={0.5}>
        <pixiText
          text="No active updates"
          anchor={0.5}
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: 24,
            fill: "#9ca3af",
          }}
          resolution={2}
        />
      </pixiContainer>
    );
  }

  return (
    <pixiContainer x={0} y={2}>
      {updates.slice(0, MAX_ROWS).map((u, i) => (
        <UpdateRow key={u.id} update={u} index={i} />
      ))}
    </pixiContainer>
  );
}
