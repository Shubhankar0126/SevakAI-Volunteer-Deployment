import type { AppRole } from "@/hooks/use-auth";

export type NavKey =
  | "overview"
  | "map"
  | "assign"
  | "emergency"
  | "roster"
  | "analytics"
  | "assistant"
  | "my-tasks"
  | "sos"
  | "my-shift";

export const ROLE_NAV: Record<AppRole, NavKey[]> = {
  admin: ["overview", "map", "assign", "emergency", "roster", "analytics", "assistant"],
  zone_manager: ["overview", "map", "assign", "emergency", "roster", "assistant"],
  volunteer: ["overview", "my-tasks", "sos", "my-shift", "assistant"],
};

export function canAccess(role: AppRole | null, key: NavKey): boolean {
  if (!role) return false;
  return ROLE_NAV[role].includes(key);
}

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  zone_manager: "Zone Manager",
  volunteer: "Volunteer",
};
