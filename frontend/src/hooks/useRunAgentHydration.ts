import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { roleToDesk, roleToVisual } from "@/lib/roleDesks";
import type { Agent as BackendAgent } from "@/types/generated";
import type { Run } from "@/types/run";
import type { Session } from "@/hooks/useSessions";

const DESK_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 220, y: 520 },
  2: { x: 460, y: 520 },
  3: { x: 700, y: 520 },
  4: { x: 940, y: 520 },
};

export function useRunAgentHydration(
  run: Run | null,
  sessionsById: Map<string, Session>,
): void {
  const ownedIds = useRef<Set<string>>(new Set());

  // Stable dep: captures membership + role changes without depending on Map identity.
  const memberKey = run
    ? run.memberSessionIds
        .filter((sid) => sid !== run.orchestratorSessionId)
        .map((sid) => `${sid}:${sessionsById.get(sid)?.role ?? ""}`)
        .join(",")
    : "";

  useEffect(() => {
    if (!run) return;

    const addAgent = useGameStore.getState().addAgent;
    const removeAgent = useGameStore.getState().removeAgent;

    const desired = new Set<string>();
    for (const sid of run.memberSessionIds) {
      if (sid === run.orchestratorSessionId) continue;
      const session = sessionsById.get(sid);
      if (!session) continue;
      const visual = roleToVisual(session.role ?? null);
      const desk = roleToDesk(session.role ?? null);
      if (!visual || !desk) continue;

      desired.add(sid);
      const existing = useGameStore.getState().agents.get(sid);
      if (existing) continue;

      const synthetic: BackendAgent = {
        id: sid,
        name: session.role ?? "agent",
        color: visual.color,
        number: visual.number,
        state: "idle",
        desk,
        currentTask: null,
        characterType: null,
        parentSessionId: null,
        parentId: null,
      };
      addAgent(synthetic, DESK_POSITIONS[desk] ?? { x: 640, y: 520 });
      ownedIds.current.add(sid);
    }

    // Only remove agents this hook created, not agents from other sources.
    for (const id of [...ownedIds.current]) {
      if (!desired.has(id)) {
        removeAgent(id);
        ownedIds.current.delete(id);
      }
    }

    return () => {
      for (const id of [...ownedIds.current]) {
        removeAgent(id);
      }
      ownedIds.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, memberKey]);
}
