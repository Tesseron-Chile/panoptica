"use client";

import type { Run } from "@/types/run";
import { useSessionsStore } from "@/stores/sessionsStore";
import { ROLE_KEYS, roleToVisual } from "@/lib/roleDesks";

const PHASE_COLOR: Record<string, string> = {
  A: "#6366f1",
  B: "#3b82f6",
  C: "#f97316",
  D: "#10b981",
  done: "#334155",
};

export interface RunMiniOfficeProps {
  run: Run;
}

export function RunMiniOffice({ run }: RunMiniOfficeProps): React.ReactNode {
  const sessionsById = useSessionsStore((s) => s.sessionsById);

  const filledRoles = new Set<string>();
  for (const sid of run.memberSessionIds) {
    const session = sessionsById.get(sid);
    if (!session?.role) continue;
    const role = session.role === "coder-continuation" ? "coder" : session.role;
    filledRoles.add(role);
  }

  const done = run.planTasks.filter((t) => t.status === "done").length;
  const total = run.planTasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const borderColor = PHASE_COLOR[run.phase] ?? "#334155";

  return (
    <div
      style={{
        width: 120,
        height: 80,
        background: "#0f172a",
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 4,
          padding: 6,
          background:
            "repeating-conic-gradient(#111827 0% 25%, #0f172a 0% 50%) 0 0 / 8px 8px",
        }}
      >
        {ROLE_KEYS.map((role) => {
          const visual = roleToVisual(role);
          const filled = filledRoles.has(role);
          return (
            <div
              key={role}
              title={role}
              style={{
                borderRadius: 2,
                background: filled && visual ? visual.color : "#1e293b",
              }}
            />
          );
        })}
      </div>

      {total > 0 && (
        <div style={{ height: 3, background: "#1e293b", flexShrink: 0 }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: borderColor,
              transition: "width 0.3s",
            }}
          />
        </div>
      )}
    </div>
  );
}
