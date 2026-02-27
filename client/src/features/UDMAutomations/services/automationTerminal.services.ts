import type { ApiResponse } from "shared";

import type {
  AutomationTerminalEventsPage,
  AutomationTerminalSnapshot,
} from "../types/automationTerminal.types";

export async function getAutomationTerminalSnapshotService(runId: string, limit = 300) {
  const response = await fetch(
    `/api/v1/automation/runs/${encodeURIComponent(runId)}/terminal?limit=${encodeURIComponent(String(limit))}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch terminal snapshot (${response.status})`);
  }

  const body = (await response.json()) as ApiResponse<AutomationTerminalSnapshot>;
  if (!body.success) {
    throw new Error(body.message || "Failed to fetch terminal snapshot");
  }

  return body.data;
}

export async function getAutomationTerminalEventsPageService(args: {
  runId: string;
  beforeSeq: number;
  limit?: number;
}) {
  const response = await fetch(
    `/api/v1/automation/runs/${encodeURIComponent(args.runId)}/terminal/events?beforeSeq=${encodeURIComponent(String(args.beforeSeq))}&limit=${encodeURIComponent(String(args.limit ?? 300))}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load older events (${response.status})`);
  }

  const body = (await response.json()) as ApiResponse<AutomationTerminalEventsPage>;
  if (!body.success) {
    throw new Error(body.message || "Failed to load older events");
  }

  return body.data;
}
