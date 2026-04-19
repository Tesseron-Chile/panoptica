"use client";

import { useRunStore, selectRuns } from "@/stores/runStore";
import { RunMiniOffice } from "@/components/campus/RunMiniOffice";
import {
  HotDeskArea,
  type HotDeskSession,
} from "@/components/campus/HotDeskArea";
import { CampusSidebar } from "@/components/campus/CampusSidebar";
import { selectHotDeskSessions } from "@/stores/runStore";
import { useNavigationStore } from "@/stores/navigationStore";

export interface CampusViewProps {
  sessions?: HotDeskSession[];
}

export function CampusView({
  sessions = [],
}: CampusViewProps): React.ReactNode {
  const runsMap = useRunStore(selectRuns);
  const runs = Array.from(runsMap.values());
  const hotDeskSessions = selectHotDeskSessions(sessions);
  const goToRunOffice = useNavigationStore((s) => s.goToRunOffice);

  return (
    <div
      className="flex gap-4 h-full overflow-hidden"
      style={{ padding: "16px" }}
    >
      {/* Main area: run offices + hot desk */}
      <div className="flex-grow flex flex-col gap-4 overflow-auto min-w-0">
        {/* Run office cards grid */}
        {runs.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {runs.map((run) => (
              <button
                key={run.runId}
                onClick={() => goToRunOffice(run.runId)}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <RunMiniOffice run={run} />
              </button>
            ))}
          </div>
        ) : (
          <div
            className="flex items-center justify-center rounded-lg p-8"
            style={{ background: "#0f172a", border: "1px dashed #1e293b" }}
          >
            <p className="text-sm font-mono" style={{ color: "#475569" }}>
              No active Ralph runs
            </p>
          </div>
        )}

        {/* Hot desk area */}
        <HotDeskArea sessions={sessions} />
      </div>

      {/* Sidebar */}
      <CampusSidebar runs={runs} hotDeskCount={hotDeskSessions.length} />
    </div>
  );
}
