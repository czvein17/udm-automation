import { useCallback, useEffect, useRef, useState } from "react";
import type { LogEvent } from "shared";
export type { LogEvent } from "shared";
import {
  capEvents,
  getServerHttpBaseUrl,
  MAX_RETRIES,
  parseWsMessage,
  reconnectDelayMs,
  wsUrlForRun,
} from "./useLogsStream.utils";

export function useLogsStream(runId: string, initialLimit = 200) {
  const [items, setItems] = useState<LogEvent[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "disconnected"
  >("idle");
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const allowReconnectRef = useRef(true);

  const clearReconnect = () => {
    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const pushOne = useCallback((event: LogEvent) => {
    setItems((prev) => capEvents([...prev, event]));
  }, []);

  const pushBatch = useCallback((batch: LogEvent[]) => {
    setItems((prev) => capEvents([...prev, ...batch]));
  }, []);

  const loadInitial = useCallback(async () => {
    if (!runId) return;

    const res = await fetch(
      `/api/v1/runs/${encodeURIComponent(runId)}/logs?limit=${encodeURIComponent(String(initialLimit))}`,
    );

    if (!res.ok) throw new Error("Failed to load logs");

    const json = (await res.json()) as {
      data?: { items?: LogEvent[]; nextCursor?: number | null };
    };

    setItems(json.data?.items ?? []);
    setNextCursor(json.data?.nextCursor ?? null);
  }, [initialLimit, runId]);

  const connect = useCallback(() => {
    if (!runId) return;

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    clearReconnect();

    setStatus("connecting");

    const httpBase = getServerHttpBaseUrl({
      envUrl: import.meta.env.VITE_SERVER_URL as string | undefined,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
    });
    const ws = new WebSocket(wsUrlForRun(runId, httpBase));
    wsRef.current = ws;

    ws.onopen = () => {
      retriesRef.current = 0;
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      const payload = parseWsMessage(String(event.data));
      if (!payload) {
        console.error("Failed to parse ws message", event.data);
        return;
      }
      if (payload.event === "logs:batch") {
        pushBatch(payload.data);
        return;
      }
      if (payload.event === "logs:line") {
        pushOne(payload.data);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (!allowReconnectRef.current) return;
      if (!runId) return;
      if (retriesRef.current >= MAX_RETRIES) {
        setStatus("disconnected");
        return;
      }

      const retry = retriesRef.current + 1;
      retriesRef.current = retry;
      const delay = reconnectDelayMs(retry);
      setStatus("connecting");

      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [pushBatch, pushOne, runId]);

  useEffect(() => {
    let cancelled = false;

    allowReconnectRef.current = false;
    clearReconnect();
    wsRef.current?.close();
    wsRef.current = null;

    if (!runId) {
      setStatus("idle");
      setNextCursor(null);
      return;
    }

    allowReconnectRef.current = true;
    retriesRef.current = 0;

    loadInitial()
      .catch((err) => {
        if (!cancelled) console.error(err);
      })
      .finally(() => {
        if (!cancelled) connect();
      });

    return () => {
      cancelled = true;
      allowReconnectRef.current = false;
      clearReconnect();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, loadInitial, runId]);

  return {
    items,
    totalCount: items.length,
    autoScroll,
    setAutoScroll,
    status,
    nextCursor,
  };
}
