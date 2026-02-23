import type { AutomationTerminalEvent } from "../types/automationTerminal.types";

const AUTO_SCROLL_THRESHOLD = 56;
const TASK_CONTEXT_PAYLOAD_KEYS = new Set([
  "rowIndex",
  "fieldName",
  "elementId",
  "tableName",
  "elementName",
  "displayName",
  "url",
]);

export function isNearBottom(element: HTMLDivElement) {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <= AUTO_SCROLL_THRESHOLD
  );
}

export function formatEventLine(event: AutomationTerminalEvent) {
  const payload = event.payload ? toPayloadInline(event.payload) : "";
  return payload ? `${event.details} ${payload}` : event.details;
}

function toPayloadInline(payload: Record<string, unknown>) {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    if (TASK_CONTEXT_PAYLOAD_KEYS.has(key)) continue;
    if (typeof value === "string" && value.trim().length === 0) continue;

    const raw = String(value);
    const compact = raw.length > 90 ? `${raw.slice(0, 87)}...` : raw;
    parts.push(`${key}=${compact}`);
  }

  if (!parts.length) return "";
  return `[${parts.join(" ")}]`;
}

export function toWsBaseUrl() {
  const origin = window.location.origin;
  if (origin.startsWith("https://")) return origin.replace("https://", "wss://");
  if (origin.startsWith("http://")) return origin.replace("http://", "ws://");
  return origin;
}

export function toRunStatusTone(status: string) {
  if (status === "SUCCESS") return "success";
  if (status === "ERROR" || status === "CANCELLED") return "error";
  if (status === "PAUSED") return "paused";
  return "running";
}
