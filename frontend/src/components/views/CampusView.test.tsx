import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CampusView } from "./CampusView";
import { useRunStore } from "@/stores/runStore";
import { useNavigationStore } from "@/stores/navigationStore";
import type { Run } from "@/types/run";
import type { HotDeskSession } from "@/components/campus/HotDeskArea";

const makeRun = (overrides: Partial<Run> = {}): Run => ({
  runId: "ral-run-001",
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

const makeHotDeskSession = (
  overrides: Partial<HotDeskSession> = {},
): HotDeskSession => ({
  id: "s-default",
  displayName: "default-session",
  projectName: null,
  status: "active",
  runId: null,
  ...overrides,
});

const savedGoToRunOffice = useNavigationStore.getState().goToRunOffice;

describe("CampusView", () => {
  beforeEach(() => {
    useRunStore.getState().clear();
    useNavigationStore.setState({ goToRunOffice: savedGoToRunOffice });
  });

  afterEach(() => {
    useNavigationStore.setState({ goToRunOffice: savedGoToRunOffice });
  });

  it('renders "No active Ralph runs" placeholder when store has zero runs', () => {
    render(<CampusView />);
    expect(screen.getByText("No active Ralph runs")).toBeInTheDocument();
  });

  it("renders N RunOfficeCard buttons when store has N runs", () => {
    const runs = [
      makeRun({ runId: "ral-run-001" }),
      makeRun({ runId: "ral-run-002" }),
      makeRun({ runId: "ral-run-003" }),
    ];
    runs.forEach((r) => useRunStore.getState().setRun(r));
    render(<CampusView />);

    // Each RunOfficeCard is a <button>; shortRunId("ral-run-NNN") → "run-NNN"
    expect(screen.getByRole("button", { name: /run-001/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run-002/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run-003/ })).toBeInTheDocument();
  });

  it("renders HotDeskArea with only sessions where runId == null", () => {
    const sessions: HotDeskSession[] = [
      makeHotDeskSession({
        id: "s-hot",
        displayName: "hot-session",
        runId: null,
      }),
      makeHotDeskSession({
        id: "s-run",
        displayName: "run-session",
        runId: "ral-run-001",
      }),
    ];
    render(<CampusView sessions={sessions} />);

    // Only the un-attached session should appear in HotDeskArea
    expect(screen.getByText("hot-session")).toBeInTheDocument();
    expect(screen.queryByText("run-session")).not.toBeInTheDocument();
  });

  it("clicking a run card calls goToRunOffice(runId)", () => {
    const mockGoToRunOffice = vi.fn();
    useNavigationStore.setState({ goToRunOffice: mockGoToRunOffice });
    useRunStore.getState().setRun(makeRun({ runId: "ral-run-001" }));

    render(<CampusView />);

    // shortRunId("ral-run-001") → "run-001"
    const card = screen.getByRole("button", { name: /run-001/ });
    fireEvent.click(card);

    expect(mockGoToRunOffice).toHaveBeenCalledWith("ral-run-001");
  });
});
