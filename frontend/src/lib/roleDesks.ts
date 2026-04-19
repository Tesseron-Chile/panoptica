import type { RoleKey } from "@/lib/runRoles";

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

export function roleToDesk(role: string | null): number | null {
  if (!role) return null;
  const key = role === "coder-continuation" ? "coder" : role;
  return (DESK_BY_ROLE as Record<string, number>)[key] ?? null;
}

export function roleToVisual(role: string | null) {
  if (!role) return null;
  const key = role === "coder-continuation" ? "coder" : role;
  return (VISUAL_BY_ROLE as Record<string, { color: string; number: number }>)[key] ?? null;
}
