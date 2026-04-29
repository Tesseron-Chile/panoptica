"use client";

import { useCallback, useEffect, useState } from "react";

import { ChatTab } from "@/components/chat/ChatTab";
import { useFloorUpdates } from "@/hooks/useFloorUpdates";
import { useNavigationStore } from "@/stores/navigationStore";
import type { FloorConfig } from "@/types/navigation";

const API_BASE = "http://localhost:8000/api/v1";

const LED_BY_PRIORITY: Record<string, string> = {
  critical: "#ef4444",
  alert: "#f59e0b",
  info: "#22c55e",
  report: "#3b82f6",
};

interface Directive {
  id: number;
  floorId: string;
  instruction: string;
  triggeredBy: string;
  status: string;
  triggeredAt: string;
}

function FloorStatusCard({ floor }: { floor: FloorConfig }) {
  const { goToFloor } = useNavigationStore();
  const { updates } = useFloorUpdates({ floorId: floor.id, limit: 1 });
  const latest = updates[0];
  const ledColor = latest
    ? (LED_BY_PRIORITY[latest.priority] ?? "#6b7280")
    : "#6b7280";

  return (
    <button
      onClick={() => goToFloor(floor.id)}
      className="w-full text-left bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-lg overflow-hidden transition-colors"
    >
      <div className="h-1 w-full" style={{ backgroundColor: floor.accent }} />

      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
          style={{
            backgroundColor: ledColor,
            boxShadow: `0 0 6px ${ledColor}`,
          }}
        />

        <div className="min-w-0 flex-grow">
          <div className="flex items-center gap-2">
            <span className="text-lg">{floor.icon}</span>
            <span className="text-sm font-semibold text-slate-200 truncate">
              {floor.name}
            </span>
          </div>
          {latest && (
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {latest.title}
            </div>
          )}
          {!latest && (
            <div className="text-[11px] text-slate-600 mt-0.5">No updates</div>
          )}
        </div>

        <div className="text-slate-600 flex-shrink-0">→</div>
      </div>
    </button>
  );
}

function DirectivesPanel() {
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/floors/c_level/directives`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Directive[] | null) => {
        if (data) setDirectives(data);
      })
      .catch(() => {
        // network error — keep stale data
      });
    return () => controller.abort();
  }, [refreshTick]);

  useEffect(() => {
    const interval = setInterval(
      () => setRefreshTick((t) => t + 1),
      10_000,
    );
    return () => clearInterval(interval);
  }, []);

  const handleTriggerArquitecto = useCallback(async () => {
    setTriggering(true);
    try {
      await fetch(`${API_BASE}/floors/c_level/arquitecto/trigger`, {
        method: "POST",
      });
      setRefreshTick((t) => t + 1);
    } finally {
      setTriggering(false);
    }
  }, []);

  return (
    <div className="w-72 flex-shrink-0 flex flex-col border-r border-slate-800 overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400">
          Directivas
        </h2>
        <button
          onClick={() => void handleTriggerArquitecto()}
          disabled={triggering}
          className="text-[10px] px-2 py-1 rounded bg-violet-700/60 hover:bg-violet-600/60 text-violet-200 disabled:opacity-50 transition-colors"
        >
          {triggering ? "…" : "⚙ Arquitecto"}
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-3 flex flex-col gap-2">
        {directives.length === 0 && (
          <div className="text-[11px] text-slate-600 text-center mt-4">
            Sin directivas recientes
          </div>
        )}
        {directives.map((d) => (
          <div
            key={d.id}
            className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[10px] font-semibold text-violet-300 truncate">
                @{d.floorId}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  d.status === "done"
                    ? "bg-green-900/50 text-green-400"
                    : "bg-amber-900/50 text-amber-400"
                }`}
              >
                {d.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              {d.instruction}
            </p>
            <div className="text-[9px] text-slate-600 mt-1">
              {d.triggeredBy} ·{" "}
              {new Date(d.triggeredAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const C_LEVEL_FLOOR_ID = "c_level";

export function CLevelView() {
  const buildingConfig = useNavigationStore((s) => s.buildingConfig);

  const regularFloors =
    buildingConfig?.floors.filter((f) => !f.is_c_level) ?? [];

  return (
    <div className="flex h-full bg-slate-950 text-white overflow-hidden">
      {/* Left column — floor status */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-800 overflow-y-auto p-4 gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-1">
          Floor Status
        </h2>
        {regularFloors.length === 0 && (
          <div className="text-slate-600 text-[11px]">No floors configured</div>
        )}
        {regularFloors.map((f) => (
          <FloorStatusCard key={f.id} floor={f} />
        ))}
      </div>

      {/* Middle column — directives + Arquitecto */}
      <DirectivesPanel />

      {/* Right column — C-Level chat */}
      <div className="flex-grow flex flex-col min-w-0">
        <div className="flex-shrink-0 border-b border-slate-800 px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400">
            C-Level Chat
          </h2>
        </div>
        <div className="flex-grow min-h-0">
          <ChatTab floorId={C_LEVEL_FLOOR_ID} />
        </div>
      </div>
    </div>
  );
}
