import type { ApiResponse } from "shared";
import type { LogEvent } from "shared/dist/schema/logs.schema";

export type RunHistorySummary = {
  runId: string;
  jobId?: string;
  runnerId?: string;
  firstTs: string;
  lastTs: string;
  totalEvents: number;
  errorCount: number;
  warnCount: number;
  status: "ok" | "fail" | "running";
  latestMessage: string;
};

export type RunEventsPage = {
  items: LogEvent[];
  nextCursor: number | null;
};

export async function fetchRunHistory(limit = 80) {
  const response = await fetch(
    `/api/v1/reporter/runs?limit=${encodeURIComponent(String(limit))}`,
  );
  const payload = (await response.json()) as ApiResponse<RunHistorySummary[]>;
  return payload;
}

export async function fetchRunEvents(runId: string, limit = 120) {
  const response = await fetch(
    `/api/v1/reporter/runs/${encodeURIComponent(runId)}/events?limit=${encodeURIComponent(String(limit))}`,
  );
  const payload = (await response.json()) as ApiResponse<RunEventsPage>;
  return payload;
}

export async function deleteRunEvents(runId: string) {
  const response = await fetch(
    `/api/v1/reporter/runs/${encodeURIComponent(runId)}/events`,
    {
      method: "DELETE",
    },
  );

  const payload = (await response.json()) as ApiResponse<{ runId: string }>;
  return payload;
}

export async function deleteAllRunEvents() {
  const response = await fetch(`/api/v1/reporter/runs`, {
    method: "DELETE",
  });

  const payload = (await response.json()) as ApiResponse<null>;
  return payload;
}
