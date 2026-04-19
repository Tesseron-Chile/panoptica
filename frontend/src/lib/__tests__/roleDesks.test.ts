import { describe, it, expect } from "vitest";
import { roleToDesk, roleToVisual, ROLE_KEYS } from "@/lib/roleDesks";

describe("roleDesks", () => {
  it("assigns stable desk indexes per role", () => {
    expect(roleToDesk("designer")).toBe(1);
    expect(roleToDesk("coder")).toBe(2);
    expect(roleToDesk("verifier")).toBe(3);
    expect(roleToDesk("reviewer")).toBe(4);
  });

  it("returns null for unknown role", () => {
    expect(roleToDesk(null)).toBeNull();
    expect(roleToDesk("orchestrator")).toBeNull();
  });

  it("exposes hex color and number per role", () => {
    expect(roleToVisual("designer")).toEqual({ color: "#a855f7", number: 1 });
    expect(roleToVisual("coder")).toEqual({ color: "#3b82f6", number: 2 });
  });

  it("exports the canonical role key ordering", () => {
    expect(ROLE_KEYS).toEqual(["designer", "coder", "verifier", "reviewer"]);
  });
});
