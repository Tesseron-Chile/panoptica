// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { useRunEvents } from "./useRunEvents";
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
// Helpers
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

describe("useRunEvents", () => {
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

  it("connects a WS for each in_progress run discovered in the store", () => {
    const { unmount } = renderHook(() => useRunEvents());

    act(() => {
      useRunStore.getState().setRun(makeRun({ runId: "ral-a" }));
    });

    expect(WS_INSTANCES).toHaveLength(1);
    expect(WS_INSTANCES[0].url).toBe("ws://localhost:3400/ws/_run:ral-a");
    unmount();
  });

  it("run_end with valid outcome updates the run", () => {
    const run = makeRun({ runId: "ral-a" });
    const { unmount } = renderHook(() => useRunEvents());

    act(() => {
      useRunStore.getState().setRun(run);
    });

    const ws = WS_INSTANCES[0];
    expect(ws).toBeDefined();

    act(() => {
      ws.triggerOpen();
      ws.triggerMessage({
        type: "event",
        event: { type: "run_end", detail: { outcome: "completed" } },
      });
    });

    expect(useRunStore.getState().runs.get("ral-a")?.outcome).toBe("completed");
    unmount();
  });

  it("run_end with missing outcome preserves existing outcome and logs a warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const run = makeRun({ runId: "ral-a", outcome: "in_progress" });
    const { unmount } = renderHook(() => useRunEvents());

    act(() => {
      useRunStore.getState().setRun(run);
    });

    const ws = WS_INSTANCES[0];
    expect(ws).toBeDefined();

    act(() => {
      ws.triggerOpen();
      // run_end event with no outcome field
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

  it("run_end with unrecognized outcome string preserves existing outcome and logs a warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const run = makeRun({ runId: "ral-b", outcome: "in_progress" });
    const { unmount } = renderHook(() => useRunEvents());

    act(() => {
      useRunStore.getState().setRun(run);
    });

    const ws = WS_INSTANCES[0];
    expect(ws).toBeDefined();

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

  it("disconnects WS after run_end", () => {
    const run = makeRun({ runId: "ral-a" });
    const { unmount } = renderHook(() => useRunEvents());

    act(() => {
      useRunStore.getState().setRun(run);
    });

    const ws = WS_INSTANCES[0];

    act(() => {
      ws.triggerOpen();
      ws.triggerMessage({
        type: "event",
        event: { type: "run_end", detail: { outcome: "completed" } },
      });
    });

    expect(ws.close).toHaveBeenCalled();
    unmount();
  });

  it("closes all WS connections on unmount", () => {
    const { unmount } = renderHook(() => useRunEvents());

    act(() => {
      useRunStore.getState().setRun(makeRun({ runId: "ral-a" }));
      useRunStore.getState().setRun(makeRun({ runId: "ral-b" }));
    });

    expect(WS_INSTANCES).toHaveLength(2);

    unmount();
    expect(WS_INSTANCES[0].close).toHaveBeenCalled();
    expect(WS_INSTANCES[1].close).toHaveBeenCalled();
  });
});
