import { describe, it, expect } from "vitest";
import { getSessionsByRole, toNookRole } from "./runRoles";

interface TestSession {
  id: string;
  role: string | null;
}

const makeRun = (memberSessionIds: string[]) => ({ memberSessionIds });

const makeSession = (id: string, role: string | null): TestSession => ({
  id,
  role,
});

describe("getSessionsByRole", () => {
  it("maps sessions to correct roles regardless of array order", () => {
    const sessions = [
      makeSession("s-reviewer", "reviewer"),
      makeSession("s-designer", "designer"),
      makeSession("s-verifier", "verifier"),
      makeSession("s-coder", "coder"),
    ];
    // memberSessionIds in an unusual order — should not affect role assignment
    const run = makeRun(["s-reviewer", "s-coder", "s-verifier", "s-designer"]);

    const result = getSessionsByRole(run, sessions);

    expect(result.designer?.id).toBe("s-designer");
    expect(result.coder?.id).toBe("s-coder");
    expect(result.verifier?.id).toBe("s-verifier");
    expect(result.reviewer?.id).toBe("s-reviewer");
  });

  it("maps coder-continuation to the coder slot", () => {
    const sessions = [makeSession("s-cont", "coder-continuation")];
    const run = makeRun(["s-cont"]);

    const result = getSessionsByRole(run, sessions);

    expect(result.coder?.id).toBe("s-cont");
    expect(result.designer).toBeNull();
    expect(result.verifier).toBeNull();
    expect(result.reviewer).toBeNull();
  });

  it("first match wins when two sessions share the same role (e.g., two coders)", () => {
    // Two sessions both claiming "coder" — first in sessions array wins.
    // Behavior: deterministic (array order), not position-in-memberSessionIds order.
    const sessions = [
      makeSession("s-coder-1", "coder"),
      makeSession("s-coder-2", "coder"),
    ];
    const run = makeRun(["s-coder-1", "s-coder-2"]);

    const result = getSessionsByRole(run, sessions);

    expect(result.coder?.id).toBe("s-coder-1");
  });

  it("returns null for a role when the session is not in the sessions list", () => {
    const sessions = [makeSession("s-designer", "designer")];
    // memberSessionIds references a session that is not loaded yet
    const run = makeRun(["s-designer", "s-coder-missing"]);

    const result = getSessionsByRole(run, sessions);

    expect(result.designer?.id).toBe("s-designer");
    expect(result.coder).toBeNull();
    expect(result.verifier).toBeNull();
    expect(result.reviewer).toBeNull();
  });

  it("returns all null when memberSessionIds is empty", () => {
    const sessions = [makeSession("s-designer", "designer")];
    const run = makeRun([]);

    const result = getSessionsByRole(run, sessions);

    expect(result.designer).toBeNull();
    expect(result.coder).toBeNull();
    expect(result.verifier).toBeNull();
    expect(result.reviewer).toBeNull();
  });

  it("ignores sessions not in memberSessionIds", () => {
    const sessions = [
      makeSession("s-not-member", "designer"),
      makeSession("s-coder", "coder"),
    ];
    const run = makeRun(["s-coder"]);

    const result = getSessionsByRole(run, sessions);

    expect(result.designer).toBeNull();
    expect(result.coder?.id).toBe("s-coder");
  });

  it("ignores sessions with null or unknown roles", () => {
    const sessions = [
      makeSession("s-no-role", null),
      makeSession("s-unknown", "orchestrator"),
    ];
    const run = makeRun(["s-no-role", "s-unknown"]);

    const result = getSessionsByRole(run, sessions);

    expect(result.designer).toBeNull();
    expect(result.coder).toBeNull();
    expect(result.verifier).toBeNull();
    expect(result.reviewer).toBeNull();
  });
});

describe("toNookRole", () => {
  it("converts lowercase role strings to NookRole", () => {
    expect(toNookRole("designer")).toBe("Designer");
    expect(toNookRole("coder")).toBe("Coder");
    expect(toNookRole("verifier")).toBe("Verifier");
    expect(toNookRole("reviewer")).toBe("Reviewer");
  });

  it("maps coder-continuation to Coder", () => {
    expect(toNookRole("coder-continuation")).toBe("Coder");
  });

  it("returns null for null or unknown roles", () => {
    expect(toNookRole(null)).toBeNull();
    expect(toNookRole("orchestrator")).toBeNull();
    expect(toNookRole("")).toBeNull();
  });
});
