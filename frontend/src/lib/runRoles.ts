import type { NookRole } from "@/components/office/RoleNook";

export type RoleKey = "designer" | "coder" | "verifier" | "reviewer";

const ROLE_KEYS: RoleKey[] = ["designer", "coder", "verifier", "reviewer"];

const ROLE_KEY_TO_NOOK: Record<RoleKey, NookRole> = {
  designer: "Designer",
  coder: "Coder",
  verifier: "Verifier",
  reviewer: "Reviewer",
};

function toRoleKey(role: string | null): RoleKey | null {
  if (!role) return null;
  if (role === "coder-continuation") return "coder";
  if ((ROLE_KEYS as string[]).includes(role)) return role as RoleKey;
  return null;
}

/**
 * Maps run member sessions to their roles using session.role — not array position.
 * Duplicate roles: first match wins.
 * Missing session in list or unknown role: returns null for that slot.
 */
export function getSessionsByRole<
  T extends { id: string; role: string | null },
>(
  run: { memberSessionIds: string[] },
  sessions: T[],
): Record<RoleKey, T | null> {
  const result: Record<RoleKey, T | null> = {
    designer: null,
    coder: null,
    verifier: null,
    reviewer: null,
  };

  const memberSet = new Set(run.memberSessionIds);

  for (const session of sessions) {
    if (!memberSet.has(session.id)) continue;
    const key = toRoleKey(session.role);
    if (!key) continue;
    if (result[key] === null) {
      result[key] = session;
    }
  }

  return result;
}

/** Converts a backend role string to the display NookRole, or null if unrecognized. */
export function toNookRole(role: string | null): NookRole | null {
  const key = toRoleKey(role);
  return key ? ROLE_KEY_TO_NOOK[key] : null;
}
