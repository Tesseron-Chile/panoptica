import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskWhiteboard } from "./TaskWhiteboard";
import type { PlanTask, PlanTaskStatus } from "@/types/run";

const makeTasks = (
  status: PlanTaskStatus,
  count: number,
  prefix: string = status,
): PlanTask[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    title: `${prefix}-task-${i}`,
    status,
    assignedSessionId: null,
  }));

describe("TaskWhiteboard", () => {
  it("renders todo / in_progress / done column headers", () => {
    render(<TaskWhiteboard tasks={[]} />);
    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("shows '— empty —' placeholder in all three columns when tasks=[]", () => {
    render(<TaskWhiteboard tasks={[]} />);
    expect(screen.getAllByText("— empty —")).toHaveLength(3);
  });

  it("shows '— empty —' in a column that has no tasks", () => {
    const tasks = makeTasks("todo", 2);
    render(<TaskWhiteboard tasks={tasks} />);
    // in_progress and done columns are empty
    expect(screen.getAllByText("— empty —")).toHaveLength(2);
  });

  it("renders task titles grouped by status", () => {
    const tasks = [
      ...makeTasks("todo", 2, "todo"),
      ...makeTasks("in_progress", 1, "ip"),
      ...makeTasks("done", 3, "done"),
    ];
    render(<TaskWhiteboard tasks={tasks} />);

    expect(screen.getByText("todo-task-0")).toBeInTheDocument();
    expect(screen.getByText("todo-task-1")).toBeInTheDocument();
    expect(screen.getByText("ip-task-0")).toBeInTheDocument();
    expect(screen.getByText("done-task-0")).toBeInTheDocument();
    expect(screen.getByText("done-task-1")).toBeInTheDocument();
    expect(screen.getByText("done-task-2")).toBeInTheDocument();
  });

  it("shows correct count per column (2 todo, 1 in_progress, 3 done)", () => {
    const tasks = [
      ...makeTasks("todo", 2, "todo"),
      ...makeTasks("in_progress", 1, "ip"),
      ...makeTasks("done", 3, "done"),
    ];
    render(<TaskWhiteboard tasks={tasks} />);

    // Column headers display count as the last span; verify by counting rendered cards
    expect(screen.getAllByText(/^todo-task-/)).toHaveLength(2);
    expect(screen.getAllByText(/^ip-task-/)).toHaveLength(1);
    expect(screen.getAllByText(/^done-task-/)).toHaveLength(3);
  });
});
