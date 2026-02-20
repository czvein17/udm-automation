import {
  logEventSchema,
  type LogEvent,
  type LogLevel,
  postLogLineSchema,
} from "./logs.schema";
import { reportEventSchema } from "shared";

const AUTO_PREFIX = /^\[AUTOMATION:\s*([^\]]+)\]\s*/;

function inferLevel(line: string): LogLevel {
  const low = line.toLowerCase();
  if (line.includes("DeprecationWarning")) return "warn";
  if (low.includes("unhandled") || low.includes("error")) return "error";
  if (low.includes("debug")) return "debug";
  return "info";
}

export function normalizeReporterMeta(message: unknown, meta: unknown) {
  if (typeof message !== "string") return meta;
  if (!meta || typeof meta !== "object") return meta;

  const record = meta as Record<string, unknown>;
  if (record.type !== message) return meta;

  const parsed = reportEventSchema.safeParse(record);
  if (!parsed.success) return meta;
  return parsed.data;
}

export function parseLogLine(input: {
  line: string;
  runId: string;
  jobId?: string;
  runnerId?: string;
}): LogEvent {
  const raw = input.line?.trim() ?? "";

  try {
    const maybeJson = JSON.parse(raw) as unknown;
    const parsed = logEventSchema.safeParse(maybeJson);
    if (parsed.success) return parsed.data;

    if (
      maybeJson &&
      typeof maybeJson === "object" &&
      (maybeJson as { tag?: string }).tag === "AUTOMATION"
    ) {
      const obj = maybeJson as Record<string, unknown>;
      const event: LogEvent = {
        id:
          typeof obj.id === "string" ? obj.id : globalThis.crypto.randomUUID(),
        runId: typeof obj.runId === "string" ? obj.runId : input.runId,
        jobId: typeof obj.jobId === "string" ? obj.jobId : input.jobId,
        runnerId:
          typeof obj.runnerId === "string" ? obj.runnerId : input.runnerId,
        ts: typeof obj.ts === "string" ? obj.ts : new Date().toISOString(),
        level: ["debug", "info", "warn", "error"].includes(String(obj.level))
          ? (obj.level as LogLevel)
          : inferLevel(String(obj.message ?? raw)),
        message: String(obj.message ?? raw),
        meta:
          obj.meta && typeof obj.meta === "object"
            ? (normalizeReporterMeta(obj.message, obj.meta) as Record<
                string,
                unknown
              >)
            : undefined,
        ctx:
          obj.ctx && typeof obj.ctx === "object"
            ? (obj.ctx as LogEvent["ctx"])
            : undefined,
        raw,
        source:
          obj.source === "server" || obj.source === "automation"
            ? obj.source
            : "automation",
      };

      const validated = logEventSchema.safeParse(event);
      if (validated.success) return validated.data;
    }
  } catch {
    // keep plain-text fallback below
  }

  const prefixMatch = raw.match(AUTO_PREFIX);
  const runId = prefixMatch?.[1] || input.runId;
  const message = raw.replace(AUTO_PREFIX, "").trim() || raw;

  return {
    id: globalThis.crypto.randomUUID(),
    runId,
    jobId: input.jobId,
    runnerId: input.runnerId,
    ts: new Date().toISOString(),
    level: inferLevel(message),
    message,
    raw,
    source: "automation",
  };
}

export function parsePostBody(
  runIdFromPath: string,
  body: unknown,
): LogEvent | null {
  const asEvent = logEventSchema.safeParse(body);
  if (asEvent.success) {
    return {
      ...asEvent.data,
      runId: asEvent.data.runId || runIdFromPath,
    };
  }

  const asLine = postLogLineSchema.safeParse(body);
  if (!asLine.success) return null;

  return parseLogLine({
    line: asLine.data.line,
    runId: asLine.data.runId ?? runIdFromPath,
    jobId: asLine.data.jobId,
    runnerId: asLine.data.runnerId,
  });
}
