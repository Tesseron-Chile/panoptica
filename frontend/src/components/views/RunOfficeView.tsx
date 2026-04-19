"use client";
import dynamic from "next/dynamic";
import { useNavigationStore } from "@/stores/navigationStore";
import { useRunStore } from "@/stores/runStore";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useRunAgentHydration } from "@/hooks/useRunAgentHydration";
import { OfficeSidebar } from "@/components/office/OfficeSidebar";

const OfficeGame = dynamic(
  () => import("@/components/game/OfficeGame").then((m) => ({ default: m.OfficeGame })),
  { ssr: false, loading: () => <div className="flex-1 bg-slate-950 animate-pulse" /> },
);

export function RunOfficeView(): React.ReactNode {
  const activeRunId = useNavigationStore((s) => s.activeRunId);
  const goToCampus = useNavigationStore((s) => s.goToCampus);
  const run = useRunStore((s) => (activeRunId ? (s.runs.get(activeRunId) ?? null) : null));
  const sessionsById = useSessionsStore((s) => s.sessionsById);

  useRunAgentHydration(run, sessionsById);

  return (
    <div className="flex flex-grow overflow-hidden min-h-0 w-full">
      <div className="flex-grow overflow-hidden relative min-h-0">
        <OfficeGame />
      </div>
      <OfficeSidebar run={run} onBack={goToCampus} />
    </div>
  );
}
