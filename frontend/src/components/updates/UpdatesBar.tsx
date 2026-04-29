"use client";

import { useFloorUpdates } from "@/hooks/useFloorUpdates";
import { useNavigationStore } from "@/stores/navigationStore";
import { PRIORITY_COLORS } from "@/types/prometeo";
import type { FloorUpdate } from "@/types";

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function UpdatePill({ update }: { update: FloorUpdate }) {
  const { goToFloor } = useNavigationStore();
  const color = PRIORITY_COLORS[update.priority];

  return (
    <button
      onClick={() => goToFloor(update.floorId)}
      className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors text-left flex-shrink-0 max-w-[260px]"
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0">
        <div className="text-[10px] text-slate-400 font-mono truncate">
          {update.floorId}
        </div>
        <div className="text-[11px] text-slate-200 truncate font-medium">
          {update.title}
        </div>
      </div>
      <div className="text-[9px] text-slate-500 flex-shrink-0 ml-auto">
        {relativeTime(update.timestamp)}
      </div>
    </button>
  );
}

export function UpdatesBar() {
  const { updates } = useFloorUpdates({ limit: 3 });

  if (updates.length === 0) return null;

  return (
    <div className="mt-4 px-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {updates.map((u) => (
          <UpdatePill key={u.id} update={u} />
        ))}
      </div>
    </div>
  );
}
