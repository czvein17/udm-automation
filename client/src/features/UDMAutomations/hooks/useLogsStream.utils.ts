import type { LogEvent } from "shared";

export type LogsWsMessage =
  | { event: "logs:batch"; data: LogEvent[] }
  | { event: "logs:line"; data: LogEvent };

export const MAX_EVENTS = 5000;
export const MAX_RETRIES = 5;

export function capEvents(items: LogEvent[]) {
  if (items.length <= MAX_EVENTS) return items;
  return items.slice(items.length - MAX_EVENTS);
}

export function getServerHttpBaseUrl(params: {
  envUrl?: string;
  protocol: string;
  hostname: string;
}) {
  const envUrl = params.envUrl?.trim();
  if (envUrl) return envUrl;
  const protocol = params.protocol === "https:" ? "https" : "http";
  return `${protocol}://${params.hostname}:3000`;
}

export function wsUrlForRun(runId: string, httpBaseUrl: string) {
  const wsBase = httpBaseUrl
    .replace(/^http:/i, "ws:")
    .replace(/^https:/i, "wss:");
  return `${wsBase}/ws/logs/${encodeURIComponent(runId)}`;
}

export function reconnectDelayMs(retryCount: number) {
  return Math.min(1000 * 2 ** Math.max(retryCount - 1, 0), 8000);
}

export function parseWsMessage(rawData: string): LogsWsMessage | null {
  try {
    const payload = JSON.parse(rawData) as LogsWsMessage;
    if (payload.event === "logs:batch" && Array.isArray(payload.data)) {
      return payload;
    }
    if (payload.event === "logs:line" && payload.data) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}
