export type RoleKey = "designer" | "coder" | "verifier" | "reviewer";

export const ROLE_KEYS: RoleKey[] = ["designer", "coder", "verifier", "reviewer"];

const DESK_BY_ROLE: Record<RoleKey, number> = {
  designer: 1,
  coder: 2,
  verifier: 3,
  reviewer: 4,
};

const VISUAL_BY_ROLE: Record<RoleKey, { color: string; number: number }> = {
  designer: { color: "#a855f7", number: 1 },
  coder: { color: "#3b82f6", number: 2 },
  verifier: { color: "#10b981", number: 3 },
  reviewer: { color: "#f59e0b", number: 4 },
};

export function isRoleKey(s: string): s is RoleKey {
  return (ROLE_KEYS as string[]).includes(s);
}

export function roleToDesk(role: string | null): number | null {
  if (!role) return null;
  const key = role === "coder-continuation" ? "coder" : role;
  return isRoleKey(key) ? DESK_BY_ROLE[key] : null;
}

export function roleToVisual(role: string | null) {
  if (!role) return null;
  const key = role === "coder-continuation" ? "coder" : role;
  return isRoleKey(key) ? VISUAL_BY_ROLE[key] : null;
}
