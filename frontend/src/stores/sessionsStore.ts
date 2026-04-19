import { create } from "zustand";
import type { Session } from "@/hooks/useSessions";

interface SessionsState {
  sessionsById: Map<string, Session>;
  setSessions: (sessions: Session[]) => void;
}

export const useSessionsStore = create<SessionsState>((set) => ({
  sessionsById: new Map(),
  setSessions: (sessions) =>
    set({ sessionsById: new Map(sessions.map((s) => [s.id, s])) }),
}));
