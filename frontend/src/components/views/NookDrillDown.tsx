"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useRunStore } from "@/stores/runStore";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useGameStore } from "@/stores/gameStore";
import { NookSidebar } from "@/components/office/NookSidebar";
import { toNookRole } from "@/lib/runRoles";
import type { RoleKey } from "@/lib/runRoles";
import type { Agent as BackendAgent } from "@/types/generated";

const ROLE_VISUAL: Record<RoleKey, { color: string; number: number }> = {
  designer: { color: "#a855f7", number: 1 },
  coder: { color: "#3b82f6", number: 2 },
  verifier: { color: "#10b981", number: 3 },
  reviewer: { color: "#f59e0b", number: 4 },
};

const OfficeGame = dynamic(
  () =>
    import("@/components/game/OfficeGame").then((m) => ({
      default: m.OfficeGame,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center text-white font-mono text-sm">
        Loading session...
      </div>
    ),
  },
);

export function NookDrillDown(): React.ReactNode {
  const activeRunId = useNavigationStore((s) => s.activeRunId);
  const activeNookSessionId = useNavigationStore((s) => s.activeNookSessionId);
  const goToRunOffice = useNavigationStore((s) => s.goToRunOffice);
  const goToCampus = useNavigationStore((s) => s.goToCampus);

  const run = useRunStore((s) =>
    activeRunId != null ? (s.runs.get(activeRunId) ?? null) : null,
  );
  const sessionsById = useSessionsStore((s) => s.sessionsById);

  const handleBack = () => {
    if (activeRunId) {
      goToRunOffice(activeRunId);
    } else {
      goToCampus();
    }
  };

  const activeSession = activeNookSessionId
    ? (sessionsById.get(activeNookSessionId) ?? null)
    : null;
  const role = toNookRole(activeSession?.role ?? null);

  // Derive model from run.modelConfig using role key
  const model =
    run && role
      ? (run.modelConfig[role.toLowerCase()] ??
        run.modelConfig[`${role.toLowerCase()}_model`] ??
        null)
      : null;

  // Find the task assigned to this session
  const task =
    run && activeNookSessionId
      ? (run.planTasks.find(
          (t) => t.assignedSessionId === activeNookSessionId,
        ) ?? null)
      : null;

  // Hydrate gameStore with a synthetic agent for this session so the
  // PixiJS canvas has something to render. Real event-driven hydration
  // will replace this once session → agent wiring lands.
  useEffect(() => {
    if (!activeNookSessionId) return;

    const roleKey = role ? (role.toLowerCase() as RoleKey) : null;
    const visual = roleKey ? ROLE_VISUAL[roleKey] : null;
    const synthetic: BackendAgent = {
      id: activeNookSessionId,
      name: role ?? "agent",
      color: visual?.color ?? "#64748b",
      number: visual?.number ?? 1,
      state: "idle",
      desk: 1,
      currentTask: task?.title ?? null,
      characterType: null,
      parentSessionId: null,
      parentId: null,
    };

    const addAgent = useGameStore.getState().addAgent;
    const removeAgent = useGameStore.getState().removeAgent;
    addAgent(synthetic, { x: 640, y: 600 });

    return () => {
      removeAgent(activeNookSessionId);
    };
  }, [activeNookSessionId, role, task?.title]);

  return (
    <div className="flex flex-grow overflow-hidden min-h-0 w-full">
      {/* OfficeGame canvas — fills remaining space */}
      <div className="flex-grow overflow-hidden relative min-h-0">
        <OfficeGame />
      </div>

      {/* Metadata sidebar */}
      <NookSidebar
        role={role}
        model={model}
        sessionId={activeNookSessionId}
        taskId={task?.id ?? null}
        taskTitle={task?.title ?? null}
        elapsedSeconds={run?.stats.elapsedSeconds ?? null}
        onBack={handleBack}
      />
    </div>
  );
}
