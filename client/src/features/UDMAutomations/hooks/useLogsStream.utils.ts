import type { LogEvent } from "shared";

export type LogsWsMessage =
  | { event: "reporter:batch"; data: LogEvent[] }
  | { event: "reporter:line"; data: LogEvent };

export const MAX_EVENTS = 20000;
export const MAX_RETRIES = 5;
export const STREAM_FLUSH_INTERVAL_MS = 60;

export function capEvents(items: LogEvent[]) {
  if (items.length <= MAX_EVENTS) return items;
  return items.slice(items.length - MAX_EVENTS);
}

export function getServerHttpBaseUrl(params: {
  envUrl?: string;
  protocol: string;
  host: string;
}) {
  const protocol = params.protocol === "https:" ? "https:" : "http:";
  const envUrl = params.envUrl?.trim();

  if (envUrl) {
    try {
      const normalized = envUrl.includes("://")
        ? envUrl
        : `${protocol}//${envUrl}`;
      const url = new URL(normalized);
      return `${url.protocol}//${url.host}`;
    } catch {
      // fall through to local host inference
    }
  }

  const normalizedHost = params.host
    .trim()
    .replace(/^[a-z]+:\/\//i, "")
    .split("/")[0]!
    .split("@").at(-1)!
    .split(":")[0]!;

  return `${protocol}//${normalizedHost}:3000`;
}

export function wsUrlForRun(runId: string, httpBaseUrl: string) {
  const wsBase = httpBaseUrl
    .replace(/^http:/i, "ws:")
    .replace(/^https:/i, "wss:");
  return `${wsBase}/ws/reporter/${encodeURIComponent(runId)}`;
}

export function reconnectDelayMs(retryCount: number) {
  return Math.min(1000 * 2 ** Math.max(retryCount - 1, 0), 8000);
}

export function parseWsMessage(rawData: string): LogsWsMessage | null {
  try {
    const payload = JSON.parse(rawData) as LogsWsMessage;
    if (payload.event === "reporter:batch" && Array.isArray(payload.data)) {
      return payload;
    }
    if (payload.event === "reporter:line" && payload.data) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}
