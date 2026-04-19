import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRunAgentHydration } from "@/hooks/useRunAgentHydration";
import { useGameStore } from "@/stores/gameStore";

function makeRun(memberSessionIds: string[], orchestratorId: string | null = null) {
  return {
    runId: "run-1",
    memberSessionIds,
    orchestratorSessionId: orchestratorId,
  };
}
function makeSessions(entries: Array<{ id: string; role: string | null }>) {
  return new Map(entries.map((e) => [e.id, { id: e.id, role: e.role } as any]));
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
    renderHook(() => useRunAgentHydration(run as any, sessions));
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
    renderHook(() => useRunAgentHydration(run as any, sessions));
    expect(useGameStore.getState().agents.has("s2")).toBe(false);
  });

  it("removes agents when members leave", () => {
    const sessions = makeSessions([
      { id: "s1", role: "designer" },
      { id: "s2", role: "coder" },
    ]);
    const { rerender } = renderHook(
      ({ run }: { run: any }) => useRunAgentHydration(run, sessions),
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
    const { unmount } = renderHook(() => useRunAgentHydration(run as any, sessions));
    expect(useGameStore.getState().agents.size).toBe(2);
    unmount();
    expect(useGameStore.getState().agents.size).toBe(0);
  });
});
