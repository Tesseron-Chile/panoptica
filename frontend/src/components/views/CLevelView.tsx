"use client";

import { ChatTab } from "@/components/chat/ChatTab";
import { useFloorUpdates } from "@/hooks/useFloorUpdates";
import { useNavigationStore } from "@/stores/navigationStore";
import { PRIORITY_COLORS } from "@/types/prometeo";
import type { FloorConfig } from "@/types/navigation";

const LED_BY_PRIORITY: Record<string, string> = {
  critical: "#ef4444",
  alert: "#f59e0b",
  info: "#22c55e",
  report: "#3b82f6",
};

function FloorStatusCard({ floor }: { floor: FloorConfig }) {
  const { goToFloor } = useNavigationStore();
  const { updates } = useFloorUpdates({ floorId: floor.id, limit: 1 });
  const latest = updates[0];
  const ledColor = latest
    ? (LED_BY_PRIORITY[latest.priority] ?? "#6b7280")
    : "#6b7280";

  // Suppress unused import warning
  void PRIORITY_COLORS;

  return (
    <button
      onClick={() => goToFloor(floor.id)}
      className="w-full text-left bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-lg overflow-hidden transition-colors"
    >
      {/* Accent strip */}
      <div className="h-1 w-full" style={{ backgroundColor: floor.accent }} />

      <div className="flex items-center gap-3 px-4 py-3">
        {/* LED dot */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
          style={{ backgroundColor: ledColor, boxShadow: `0 0 6px ${ledColor}` }}
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
