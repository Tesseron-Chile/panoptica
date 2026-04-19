// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { useRunList } from "./useRunList";
import { useRunStore } from "@/stores/runStore";
import type { Run } from "@/types/run";

// ============================================================================
// WebSocket mock
// ============================================================================

interface MockWebSocket {
  url: string;
  onopen: ((e: Event) => void) | null;
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onclose: ((e: CloseEvent) => void) | null;
  close: ReturnType<typeof vi.fn>;
  triggerOpen: () => void;
  triggerMessage: (data: unknown) => void;
  triggerClose: () => void;
}

const WS_INSTANCES: MockWebSocket[] = [];

class FakeWebSocket {
  url: string;
  onopen: ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  onclose: ((e: CloseEvent) => void) | null = null;
  close = vi.fn();
  readyState = 0;

  constructor(url: string) {
    this.url = url;
    WS_INSTANCES.push(this as unknown as MockWebSocket);
  }

  triggerOpen() {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }

  triggerMessage(data: unknown) {
    this.onmessage?.(
      new MessageEvent("message", { data: JSON.stringify(data) }),
    );
  }

  triggerClose() {
    this.readyState = 3;
    this.onclose?.(new CloseEvent("close"));
  }
}

// ============================================================================
// Fetch mock
// ============================================================================

function mockFetch(runs: Run[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(runs),
    }),
  );
}

function mockFetchFail() {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
}

// ============================================================================
// Test helpers
// ============================================================================

function renderHook(fn: () => void): { unmount: () => void } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  function HookWrapper() {
    fn();
    return null;
  }

  act(() => {
    root.render(createElement(HookWrapper));
  });

  return {
    unmount: () =>
      act(() => {
        root.unmount();
        container.remove();
      }),
  };
}

// ============================================================================
// Fixtures
// ============================================================================

const makeRun = (overrides: Partial<Run> = {}): Run => ({
  runId: "ral-test-001",
  orchestratorSessionId: null,
  primaryRepo: "test/repo",
  workdocsDir: "workdocs",
  phase: "B",
  startedAt: "2026-04-18T00:00:00Z",
  endedAt: null,
  outcome: "in_progress",
  modelConfig: {},
  memberSessionIds: [],
  planTasks: [],
  stats: { elapsedSeconds: 0, phaseTimings: {} },
  tokenUsage: null,
  costUsd: null,
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe("useRunList", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeWebSocket);
    WS_INSTANCES.length = 0;
    useRunStore.getState().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("fetches runs on mount and populates store", async () => {
    const run = makeRun();
    mockFetch([run]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    expect(useRunStore.getState().runs.get("ral-test-001")).toEqual(run);
    unmount();
  });

  it("opens WebSocket for each in_progress run", async () => {
    mockFetch([makeRun({ runId: "ral-a" }), makeRun({ runId: "ral-b" })]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    expect(WS_INSTANCES).toHaveLength(2);
    const urls = WS_INSTANCES.map((ws) => ws.url);
    expect(urls).toContain("ws://localhost:3400/ws/_run:ral-a");
    expect(urls).toContain("ws://localhost:3400/ws/_run:ral-b");
    unmount();
  });

  it("does not open WebSocket for ended runs", async () => {
    mockFetch([makeRun({ runId: "ral-ended", outcome: "completed" })]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    // Run is stored but no WS opened
    expect(useRunStore.getState().runs.get("ral-ended")).toBeDefined();
    expect(WS_INSTANCES).toHaveLength(0);
    unmount();
  });

  it("polls every 5 seconds and adds newly discovered runs", async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([makeRun({ runId: "ral-a" })]),
      })
      .mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            makeRun({ runId: "ral-a" }),
            makeRun({ runId: "ral-b" }),
          ]),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    expect(WS_INSTANCES).toHaveLength(1);

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(WS_INSTANCES).toHaveLength(2);
    unmount();
  });

  it("removes runs from store when no longer in API response", async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([makeRun({ runId: "ral-a" })]),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    expect(useRunStore.getState().runs.has("ral-a")).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(useRunStore.getState().runs.has("ral-a")).toBe(false);
    unmount();
  });

  it("disconnects WebSocket when run_state message has non-in_progress outcome", async () => {
    const run = makeRun({ runId: "ral-a" });
    mockFetch([run]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    const ws = WS_INSTANCES[0];
    expect(ws).toBeDefined();

    act(() => {
      ws.triggerMessage({
        type: "run_state",
        run: { ...run, outcome: "completed" },
      });
    });

    expect(ws.close).toHaveBeenCalled();
    unmount();
  });

  it("closes all WebSocket connections on unmount", async () => {
    mockFetch([makeRun({ runId: "ral-a" }), makeRun({ runId: "ral-b" })]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    expect(WS_INSTANCES).toHaveLength(2);
    unmount();

    expect(WS_INSTANCES[0].close).toHaveBeenCalled();
    expect(WS_INSTANCES[1].close).toHaveBeenCalled();
  });

  it("silently ignores fetch errors", async () => {
    mockFetchFail();

    expect(() => {
      const { unmount } = renderHook(() => useRunList());
      act(() => {});
      unmount();
    }).not.toThrow();
  });

  // --------------------------------------------------------------------------
  // Single connection per run (not 2N)
  // --------------------------------------------------------------------------

  it("opens exactly N WebSocket instances for N active runs (not 2N)", async () => {
    const N = 3;
    const runs = Array.from({ length: N }, (_, i) =>
      makeRun({ runId: `ral-${i}` }),
    );
    mockFetch(runs);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    expect(WS_INSTANCES).toHaveLength(N);
    unmount();
  });

  // --------------------------------------------------------------------------
  // Demux: single WS handles both run_state and event message types
  // --------------------------------------------------------------------------

  it("demux: run_state message updates store via the shared WS", async () => {
    const run = makeRun({ runId: "ral-a" });
    mockFetch([run]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    const ws = WS_INSTANCES[0];
    expect(ws).toBeDefined();

    const updatedRun = { ...run, phase: "C" as const };
    act(() => {
      ws.triggerMessage({ type: "run_state", run: updatedRun });
    });

    expect(useRunStore.getState().runs.get("ral-a")?.phase).toBe("C");
    unmount();
  });

  it("demux: event message dispatches correctly via the shared WS", async () => {
    const run = makeRun({ runId: "ral-a" });
    mockFetch([run]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    const ws = WS_INSTANCES[0];
    expect(ws).toBeDefined();

    act(() => {
      ws.triggerMessage({
        type: "event",
        event: { type: "role_session_joined", agentId: "sess-xyz" },
      });
    });

    expect(
      useRunStore.getState().runs.get("ral-a")?.memberSessionIds,
    ).toContain("sess-xyz");
    unmount();
  });

  // --------------------------------------------------------------------------
  // Event handling (run_end, role_session_joined)
  // --------------------------------------------------------------------------

  it("run_end with valid outcome updates the run and disconnects WS", async () => {
    const run = makeRun({ runId: "ral-a" });
    mockFetch([run]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    const ws = WS_INSTANCES[0];
    act(() => {
      ws.triggerOpen();
      ws.triggerMessage({
        type: "event",
        event: { type: "run_end", detail: { outcome: "completed" } },
      });
    });

    expect(useRunStore.getState().runs.get("ral-a")?.outcome).toBe("completed");
    expect(ws.close).toHaveBeenCalled();
    unmount();
  });

  it("run_end with missing outcome preserves existing outcome and logs a warning", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const run = makeRun({ runId: "ral-a", outcome: "in_progress" });
    mockFetch([run]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    const ws = WS_INSTANCES[0];
    act(() => {
      ws.triggerOpen();
      ws.triggerMessage({
        type: "event",
        event: { type: "run_end", detail: {} },
      });
    });

    expect(useRunStore.getState().runs.get("ral-a")?.outcome).toBe(
      "in_progress",
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing/unrecognized outcome"),
    );
    warnSpy.mockRestore();
    unmount();
  });

  it("run_end with unrecognized outcome preserves existing outcome and logs a warning", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const run = makeRun({ runId: "ral-b", outcome: "in_progress" });
    mockFetch([run]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    const ws = WS_INSTANCES[0];
    act(() => {
      ws.triggerOpen();
      ws.triggerMessage({
        type: "event",
        event: { type: "run_end", detail: { outcome: "unknown_value" } },
      });
    });

    expect(useRunStore.getState().runs.get("ral-b")?.outcome).toBe(
      "in_progress",
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing/unrecognized outcome"),
    );
    warnSpy.mockRestore();
    unmount();
  });

  it("role_session_joined appends sessionId to memberSessionIds", async () => {
    const run = makeRun({ runId: "ral-a", memberSessionIds: [] });
    mockFetch([run]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    const ws = WS_INSTANCES[0];
    act(() => {
      ws.triggerMessage({
        type: "event",
        event: { type: "role_session_joined", agentId: "sess-123" },
      });
    });

    expect(useRunStore.getState().runs.get("ral-a")?.memberSessionIds).toEqual([
      "sess-123",
    ]);
    unmount();
  });

  it("role_session_joined does not duplicate an existing sessionId", async () => {
    const run = makeRun({
      runId: "ral-a",
      memberSessionIds: ["sess-existing"],
    });
    mockFetch([run]);

    const { unmount } = renderHook(() => useRunList());
    await act(async () => {
      await Promise.resolve();
    });

    const ws = WS_INSTANCES[0];
    act(() => {
      ws.triggerMessage({
        type: "event",
        event: { type: "role_session_joined", agentId: "sess-existing" },
      });
    });

    expect(useRunStore.getState().runs.get("ral-a")?.memberSessionIds).toEqual([
      "sess-existing",
    ]);
    unmount();
  });
});
