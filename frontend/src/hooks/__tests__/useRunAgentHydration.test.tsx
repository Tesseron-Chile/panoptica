import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRunAgentHydration } from "@/hooks/useRunAgentHydration";
import { useGameStore } from "@/stores/gameStore";
import type { Run } from "@/types/run";
import type { Session } from "@/hooks/useSessions";

function makeRun(memberSessionIds: string[], orchestratorId: string | null = null): Run {
  return {
    runId: "run-1",
    orchestratorSessionId: orchestratorId,
    primaryRepo: "test/repo",
    workdocsDir: "workdocs",
    phase: "B",
    startedAt: "2026-01-01T00:00:00Z",
    endedAt: null,
    outcome: "in_progress",
    modelConfig: {},
    memberSessionIds,
    planTasks: [],
    stats: { elapsedSeconds: 0, phaseTimings: {} },
    tokenUsage: null,
    costUsd: null,
  };
}

function makeSession(id: string, role: string | null): Session {
  return {
    id,
    role,
    projectName: null,
    displayName: null,
    projectRoot: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    status: "active",
    eventCount: 0,
    floorId: null,
    roomId: null,
    runId: null,
  };
}

function makeSessions(entries: Array<{ id: string; role: string | null }>): Map<string, Session> {
  return new Map(entries.map((e) => [e.id, makeSession(e.id, e.role)]));
}

beforeEach(() => {
  useGameStore.setState({ agents: new Map() });
});

describe("useRunAgentHydration", () => {
  it("adds one agent per member session with role", () => {
    const run = makeRun(["s1", "s2"]);
    const sessions = makeSessions([
      { id: "s1", role: "designer" },
      { id: "s2", role: "coder" },
    ]);
    renderHook(() => useRunAgentHydration(run, sessions));
    const agents = useGameStore.getState().agents;
    expect(agents.size).toBe(2);
    expect(agents.get("s1")?.color).toBe("#a855f7");
    expect(agents.get("s2")?.color).toBe("#3b82f6");
  });

  it("does not add agents for the orchestrator session", () => {
    const run = makeRun(["s1", "s2"], "s2");
    const sessions = makeSessions([
      { id: "s1", role: "designer" },
      { id: "s2", role: null },
    ]);
    renderHook(() => useRunAgentHydration(run, sessions));
    expect(useGameStore.getState().agents.has("s2")).toBe(false);
  });

  it("removes agents when members leave", () => {
    const sessions = makeSessions([
      { id: "s1", role: "designer" },
      { id: "s2", role: "coder" },
    ]);
    const { rerender } = renderHook(
      ({ run }: { run: Run }) => useRunAgentHydration(run, sessions),
      { initialProps: { run: makeRun(["s1", "s2"]) } },
    );
    expect(useGameStore.getState().agents.size).toBe(2);
    rerender({ run: makeRun(["s1"]) });
    expect(useGameStore.getState().agents.size).toBe(1);
    expect(useGameStore.getState().agents.has("s2")).toBe(false);
  });

  it("clears all agents on unmount", () => {
    const run = makeRun(["s1", "s2"]);
    const sessions = makeSessions([
      { id: "s1", role: "designer" },
      { id: "s2", role: "coder" },
    ]);
    const { unmount } = renderHook(() => useRunAgentHydration(run, sessions));
    expect(useGameStore.getState().agents.size).toBe(2);
    unmount();
    expect(useGameStore.getState().agents.size).toBe(0);
  });
});
