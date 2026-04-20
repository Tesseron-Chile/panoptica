"use client";

import { useNavigationStore } from "@/stores/navigationStore";
import { useRunStore } from "@/stores/runStore";

function shortRunId(runId: string): string {
  return runId.slice(0, 12);
}

export function Breadcrumb(): React.ReactNode {
  const {
    view,
    floorId,
    buildingConfig,
    goToBuilding,
    goToCampus,
    activeRunId,
  } = useNavigationStore();
  const runs = useRunStore((s) => s.runs);

  const floor = buildingConfig?.floors.find((f) => f.id === floorId);
  const activeRun =
    activeRunId != null ? (runs.get(activeRunId) ?? null) : null;

  if (view === "campus") {
    return (
      <nav className="flex items-center gap-1.5 text-sm font-mono">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-white bg-slate-800">
          <span>🏙️</span>
          <span>Campus</span>
        </span>
      </nav>
    );
  }

  if (view === "run-office") {
    return (
      <nav className="flex items-center gap-1.5 text-sm font-mono">
        <button
          onClick={goToCampus}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <span>🏙️</span>
          <span>Campus</span>
        </button>
        <span className="text-slate-600">/</span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-white bg-slate-800">
          <span>🏢</span>
          <span>
            Run {activeRunId ? shortRunId(activeRunId) : "—"}
            {activeRun ? ` (Phase ${activeRun.phase})` : ""}
          </span>
        </span>
      </nav>
    );
  }

  // Legacy building / floor views
  return (
    <nav className="flex items-center gap-1.5 text-sm font-mono">
      <button
        onClick={(e) => {
          useNavigationStore
            .getState()
            .setTransitionOrigin({ x: e.clientX, y: e.clientY });
          goToBuilding();
        }}
        data-tour-id="breadcrumb-building"
        className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
          view === "building"
            ? "text-white bg-slate-800"
            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
        }`}
      >
        <span>🏢</span>
        <span>{buildingConfig?.building_name ?? "Building"}</span>
      </button>

      {floor && (
        <>
          <span className="text-slate-600">/</span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-white bg-slate-800">
            <span>{floor.icon}</span>
            <span>{floor.name}</span>
          </span>
        </>
      )}
    </nav>
  );
}
