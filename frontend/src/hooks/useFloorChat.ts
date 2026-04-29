"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChatMessage } from "@/types";

const API_BASE = "http://localhost:8000/api/v1";
const WS_BASE = "ws://localhost:8000";

interface UseFloorChatResult {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useFloorChat(floorId: string | null): UseFloorChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!floorId) {
      setMessages([]);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/floors/${floorId}/chat?limit=50`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ChatMessage[] = await res.json();
        if (!cancelled) {
          // API returns newest-first; reverse for chronological display
          setMessages([...data].reverse());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load chat");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchHistory();

    // Open floor WebSocket
    const ws = new WebSocket(`${WS_BASE}/ws/floor/${floorId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "chat_message") {
          setMessages((prev) => [...prev, msg.message as ChatMessage]);
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      cancelled = true;
      ws.close();
      wsRef.current = null;
    };
  }, [floorId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!floorId) return;
      const res = await fetch(`${API_BASE}/floors/${floorId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "user", role: "user", content }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
    [floorId],
  );

  return { messages, sendMessage, isLoading, error };
}
