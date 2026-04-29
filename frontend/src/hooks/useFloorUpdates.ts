"use client";

import { useState, useEffect, useCallback } from "react";
import type { FloorUpdate } from "@/types";

const API_BASE = "http://localhost:8000/api/v1";
const POLL_INTERVAL_MS = 30_000;

interface UseFloorUpdatesOptions {
  floorId?: string | null;
  limit?: number;
}

interface UseFloorUpdatesResult {
  updates: FloorUpdate[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFloorUpdates({
  floorId,
  limit = 10,
}: UseFloorUpdatesOptions = {}): UseFloorUpdatesResult {
  const [updates, setUpdates] = useState<FloorUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = floorId
        ? `${API_BASE}/floors/${floorId}/updates`
        : `${API_BASE}/updates/latest?limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FloorUpdate[] = await res.json();
      setUpdates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load updates");
    } finally {
      setIsLoading(false);
    }
  }, [floorId, limit]);

  useEffect(() => {
    fetchUpdates();
    const interval = setInterval(fetchUpdates, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUpdates]);

  return { updates, isLoading, error, refresh: fetchUpdates };
}
