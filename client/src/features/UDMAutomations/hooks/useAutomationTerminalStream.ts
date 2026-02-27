import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  mergeEvents,
  mergeTasks,
  type AutomationTerminalEvent,
  type AutomationTerminalSnapshot,
  type AutomationTerminalTask,
  type TerminalConnectionStatus,
} from "../types/automationTerminal.types";
import { toWsBaseUrl } from "../utils/automationTerminal.utils";
import { getAutomationTerminalSnapshotService } from "../services/automationTerminal.services";

type WsEventMessage = {
  kind: "event";
  runId: string;
};

type WsStateMessage = {
  kind: "state";
  runId: string;
};

type WsSubscribedMessage = {
  kind: "subscribed";
  runId: string;
};

type WsMessage = WsEventMessage | WsStateMessage | WsSubscribedMessage;

function isSameRun(
  left: AutomationTerminalSnapshot["run"] | null,
  right: AutomationTerminalSnapshot["run"],
) {
  if (!left) return false;

  return (
    left.id === right.id &&
    left.engine === right.engine &&
    left.status === right.status &&
    left.createdAt === right.createdAt &&
    left.updatedAt === right.updatedAt
  );
}

export function useAutomationTerminalStream(runId: string) {
  const normalizedRunId = runId.trim();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TerminalConnectionStatus>("connecting");
  const [run, setRun] = useState<AutomationTerminalSnapshot["run"] | null>(
    null,
  );
  const [tasks, setTasks] = useState<AutomationTerminalTask[]>([]);
  const [events, setEvents] = useState<AutomationTerminalEvent[]>([]);
  const [nextBeforeSeq, setNextBeforeSeq] = useState<number | undefined>(
    undefined,
  );

  const refetchTimerRef = useRef<number | null>(null);

  const snapshotQuery = useQuery({
    queryKey: ["automation-terminal-snapshot", normalizedRunId],
    enabled: Boolean(normalizedRunId),
    queryFn: () => getAutomationTerminalSnapshotService(normalizedRunId, 300),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!normalizedRunId) {
      setStatus("disconnected");
      setRun(null);
      setTasks([]);
      setEvents([]);
      setNextBeforeSeq(undefined);
      return;
    }

    setStatus("connecting");
    setRun(null);
    setTasks([]);
    setEvents([]);
    setNextBeforeSeq(undefined);

    let disposed = false;
    let reconnectTimer: number | null = null;
    let attempt = 0;
    let ws: WebSocket | null = null;

    const scheduleSnapshotRefetch = () => {
      if (refetchTimerRef.current != null) return;
      refetchTimerRef.current = window.setTimeout(() => {
        refetchTimerRef.current = null;
        void queryClient.invalidateQueries({
          queryKey: ["automation-terminal-snapshot", normalizedRunId],
        });
      }, 150);
    };

    const connect = () => {
      if (disposed) return;

      setStatus("connecting");
      ws = new WebSocket(`${toWsBaseUrl()}/ws/automation-terminal`);

      ws.onopen = () => {
        attempt = 0;
        setStatus("connected");
        ws?.send(JSON.stringify({ kind: "subscribe", runId: normalizedRunId }));
      };

      ws.onclose = () => {
        if (disposed) return;
        setStatus("disconnected");
        attempt += 1;
        const delay = Math.min(4000, 400 * attempt);
        reconnectTimer = window.setTimeout(() => connect(), delay);
      };

      ws.onerror = () => {
        setStatus("disconnected");
      };

      ws.onmessage = (message) => {
        let parsed: WsMessage | null = null;

        try {
          parsed = JSON.parse(String(message.data)) as WsMessage;
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
          return;
        }

        if (!parsed || parsed.runId !== normalizedRunId) return;

        if (
          parsed.kind === "event" ||
          parsed.kind === "state" ||
          parsed.kind === "subscribed"
        ) {
          scheduleSnapshotRefetch();
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer != null) {
        window.clearTimeout(reconnectTimer);
      }
      if (refetchTimerRef.current != null) {
        window.clearTimeout(refetchTimerRef.current);
      }
      ws?.close();
    };
  }, [normalizedRunId, queryClient]);

  useEffect(() => {
    if (!normalizedRunId || !snapshotQuery.data) return;

    setRun((prev) =>
      isSameRun(prev, snapshotQuery.data.run) ? prev : snapshotQuery.data.run,
    );
    setTasks((prev) =>
      prev.length
        ? mergeTasks(prev, snapshotQuery.data.tasks)
        : snapshotQuery.data.tasks,
    );
    setEvents((prev) =>
      prev.length
        ? mergeEvents(prev, snapshotQuery.data.events)
        : snapshotQuery.data.events,
    );
    setNextBeforeSeq((prev) => prev ?? snapshotQuery.data.page.nextBeforeSeq);
  }, [normalizedRunId, snapshotQuery.data]);

  const counts = useMemo(() => {
    const taskIds = new Set(events.map((event) => event.taskId));
    return {
      events: events.length,
      tasks: taskIds.size,
    };
  }, [events]);

  const prependOlderEvents = (
    olderEvents: AutomationTerminalEvent[],
    cursor?: number,
  ) => {
    setEvents((prev) => mergeEvents(prev, olderEvents));
    setNextBeforeSeq(cursor);
  };

  return {
    status,
    run,
    tasks,
    events,
    isLoadingSnapshot: snapshotQuery.isLoading,
    snapshotError: snapshotQuery.error,
    counts,
    nextBeforeSeq,
    prependOlderEvents,
  };
}
