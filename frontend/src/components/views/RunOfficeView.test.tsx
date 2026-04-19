import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RunOfficeView } from "./RunOfficeView";
import { useRunStore } from "@/stores/runStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useSessionsStore } from "@/stores/sessionsStore";
import type { Run } from "@/types/run";
import type { Session } from "@/hooks/useSessions";

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

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: "sess-default",
  projectName: null,
  displayName: null,
  projectRoot: null,
  createdAt: "2026-04-18T00:00:00Z",
  updatedAt: "2026-04-18T00:00:00Z",
  status: "active",
  eventCount: 0,
  floorId: null,
  roomId: null,
  role: null,
  runId: "ral-run-001",
  ...overrides,
});

const savedGoToCampus = useNavigationStore.getState().goToCampus;
const savedGoToNook = useNavigationStore.getState().goToNook;

describe("RunOfficeView", () => {
  beforeEach(() => {
    useRunStore.getState().clear();
    useSessionsStore.setState({ sessionsById: new Map() });
    useNavigationStore.setState({
      activeRunId: null,
      goToCampus: savedGoToCampus,
      goToNook: savedGoToNook,
    });
  });

  afterEach(() => {
    useNavigationStore.setState({
      goToCampus: savedGoToCampus,
      goToNook: savedGoToNook,
    });
  });

  it("renders OrchestratorStation and 4 RoleNooks for a valid run", () => {
    useRunStore.getState().setRun(makeRun({ runId: "ral-run-001" }));
    useNavigationStore.setState({ activeRunId: "ral-run-001" });

    render(<RunOfficeView />);

    expect(screen.getByText("Orchestrator")).toBeInTheDocument();
    expect(screen.getByTitle(/Designer/)).toBeInTheDocument();
    expect(screen.getByTitle(/Coder/)).toBeInTheDocument();
    expect(screen.getByTitle(/Verifier/)).toBeInTheDocument();
    expect(screen.getByTitle(/Reviewer/)).toBeInTheDocument();
  });

  it("active nooks (session assigned) are fully opaque; inactive are dimmed", () => {
    const coderSession = makeSession({ id: "sess-coder", role: "coder" });
    useRunStore
      .getState()
      .setRun(
        makeRun({ runId: "ral-run-001", memberSessionIds: ["sess-coder"] }),
      );
    useSessionsStore.setState({
      sessionsById: new Map([["sess-coder", coderSession]]),
    });
    useNavigationStore.setState({ activeRunId: "ral-run-001" });

    render(<RunOfficeView />);

    const activeNook = screen.getByTitle("Coder — session: sess-coder");
    expect(activeNook.style.opacity).toBe("1");

    const inactiveNook = screen.getByTitle("Designer — unoccupied");
    expect(inactiveNook.style.opacity).toBe("0.45");
  });

  it("back button calls goToCampus()", () => {
    const mockGoToCampus = vi.fn();
    useRunStore.getState().setRun(makeRun({ runId: "ral-run-001" }));
    useNavigationStore.setState({
      activeRunId: "ral-run-001",
      goToCampus: mockGoToCampus,
    });

    render(<RunOfficeView />);

    fireEvent.click(screen.getByRole("button", { name: /campus/i }));
    expect(mockGoToCampus).toHaveBeenCalledOnce();
  });

  it("clicking an active nook calls goToNook(runId, sessionId)", () => {
    const mockGoToNook = vi.fn();
    const coderSession = makeSession({ id: "sess-coder", role: "coder" });
    useRunStore
      .getState()
      .setRun(
        makeRun({ runId: "ral-run-001", memberSessionIds: ["sess-coder"] }),
      );
    useSessionsStore.setState({
      sessionsById: new Map([["sess-coder", coderSession]]),
    });
    useNavigationStore.setState({
      activeRunId: "ral-run-001",
      goToNook: mockGoToNook,
    });

    render(<RunOfficeView />);

    const coderNook = screen.getByTitle("Coder — session: sess-coder");
    fireEvent.click(coderNook);

    expect(mockGoToNook).toHaveBeenCalledWith("ral-run-001", "sess-coder");
  });
});
