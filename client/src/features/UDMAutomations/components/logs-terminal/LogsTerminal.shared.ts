import type { TaskGroup } from "@features/UDMAutomations/utils/LogsTerminal.mapper";

export type LogsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected";

export function valueOrDash(value?: string | null): string {
  return value ?? "-";
}

export function getGroupBadge(group: TaskGroup): {
  label: "ok" | "fail" | "running";
  className: string;
} {
  if (group.status === "fail" || group.issues.length > 0) {
    return { label: "fail", className: "logs-badge-fail" };
  }
  if (group.status === "ok") {
    return { label: "ok", className: "logs-badge-ok" };
  }
  return { label: "running", className: "logs-badge-running" };
}
