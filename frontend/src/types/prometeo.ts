export interface ChatMessage {
  id: number;
  floorId: string;
  sender: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string;
}

export interface FloorUpdate {
  id: number;
  floorId: string;
  priority: "critical" | "alert" | "info" | "report";
  title: string;
  body: string;
  timestamp: string;
  autoExpireHours: number;
  resolved: boolean;
}

export const PRIORITY_COLORS: Record<FloorUpdate["priority"], string> = {
  critical: "#ef4444",
  alert: "#f59e0b",
  info: "#22c55e",
  report: "#3b82f6",
};
