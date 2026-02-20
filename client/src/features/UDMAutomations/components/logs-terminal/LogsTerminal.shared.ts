import type { TaskGroup } from "../../utils/LogsTerminal.mapper";

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
    return { label: "fail", className: "bg-rose-700 text-rose-100" };
  }
  if (group.status === "ok") {
    return { label: "ok", className: "bg-emerald-700 text-emerald-100" };
  }
  return { label: "running", className: "bg-slate-700 text-slate-100" };
}
