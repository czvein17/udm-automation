export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = {
  fieldName?: string;
  elementId?: string;
  elementName?: string;
  displayName?: string;
  tableName?: string;
  taskId?: string;
  surveyline?: string;
  automationType?: string;
};

type LogMeta = Record<string, unknown>;

type LoggerBase = {
  runId: string;
  jobId: string;
  runnerId: string;
  source?: "automation" | "server";
};

type HeaderOptions = {
  jobId: string;
  runId: string;
  runnerId: string;
  startedAt: Date | string;
  surveyline?: string;
  automationType?: string;
  translation?: string;
};

type LoggerOptions = LoggerBase & {
  surveyline?: string;
  automationType?: string;
  translation?: string;
};

export type AutomationLogger = ReturnType<typeof makeLogger>;

const BAR = "────────────────────────────────────────────────────────────";
const LEVEL_WIDTH = 5;
const LABEL_WIDTH = 20;

function apiBaseUrl() {
  return process.env.BHVR_API_BASE_URL || "http://localhost:3000";
}

function padRight(value: string, width: number) {
  if (value.length >= width) return value;
  return value + " ".repeat(width - value.length);
}

function hhmmss(ts: string) {
  const dt = new Date(ts);
  if (Number.isNaN(dt.getTime())) return "--:--:--";
  return dt.toLocaleTimeString("en-GB", { hour12: false });
}

function asTokenValue(value: unknown) {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (!str) return null;
  return /\s/.test(str) ? JSON.stringify(str) : str;
}

function toTokens(meta?: LogMeta, ctx?: LogContext) {
  const out: string[] = [];
  const merged: Record<string, unknown> = {
    ...(ctx ?? {}),
    ...(meta ?? {}),
  };

  for (const [key, value] of Object.entries(merged)) {
    const token = asTokenValue(value);
    if (!token) continue;
    out.push(`${key}=${token}`);
  }
  return out;
}

async function emit(
  base: LoggerBase,
  level: LogLevel,
  label: string,
  meta?: LogMeta,
  ctx?: LogContext,
) {
  const ts = new Date().toISOString();
  const payload = {
    id: globalThis.crypto.randomUUID(),
    runId: base.runId,
    jobId: base.jobId,
    runnerId: base.runnerId,
    ts,
    level,
    message: label,
    meta,
    ctx,
    source: base.source ?? "automation",
  } as const;

  const line =
    `[${hhmmss(ts)}] ${padRight(level.toUpperCase(), LEVEL_WIDTH)}  ${padRight(
      label,
      LABEL_WIDTH,
    )} ${toTokens(meta, ctx).join(" ")}`.trimEnd();

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);

  await fetch(
    `${apiBaseUrl()}/api/v1/runs/${encodeURIComponent(base.runId)}/logs`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  ).catch(() => undefined);
}

export function printHeader(options: HeaderOptions) {
  const started =
    options.startedAt instanceof Date
      ? options.startedAt.toLocaleString()
      : new Date(options.startedAt).toLocaleString();

  const configTokens = [
    `surveyline=${options.surveyline ?? "-"}`,
    `type=${options.automationType ?? "-"}`,
    `lang=${options.translation ?? "English"}`,
  ].join(" | ");

  console.log(BAR);
  console.log("AUTOMATION RUN");
  console.log(`Job     : ${options.jobId}`);
  console.log(`Run ID  : ${options.runId}`);
  console.log(`Runner  : ${options.runnerId}`);
  console.log(`Started : ${started}`);
  console.log(`Config  : ${configTokens}`);
  console.log(BAR);
}

export function startTask(taskName: string, target?: string) {
  console.log(BAR);
  console.log(`TASK: ${taskName}`);
  if (target) console.log(`Target : ${target}`);
  console.log(BAR);
}

export async function info(
  base: LoggerBase,
  label: string,
  meta?: LogMeta,
  ctx?: LogContext,
) {
  await emit(base, "info", label, meta, ctx);
}

export async function debug(
  base: LoggerBase,
  label: string,
  meta?: LogMeta,
  ctx?: LogContext,
) {
  await emit(base, "debug", label, meta, ctx);
}

export async function warn(
  base: LoggerBase,
  label: string,
  meta?: LogMeta,
  ctx?: LogContext,
) {
  await emit(base, "warn", label, meta, ctx);
}

export async function error(
  base: LoggerBase,
  label: string,
  meta?: LogMeta,
  ctx?: LogContext,
) {
  await emit(base, "error", label, meta, ctx);
}

export function makeLogger(options: LoggerOptions) {
  const base: LoggerBase = {
    runId: options.runId,
    jobId: options.jobId,
    runnerId: options.runnerId,
    source: options.source ?? "automation",
  };

  return {
    printHeader: () =>
      printHeader({
        jobId: options.jobId,
        runId: options.runId,
        runnerId: options.runnerId,
        startedAt: new Date(),
        surveyline: options.surveyline,
        automationType: options.automationType,
        translation: options.translation,
      }),
    startTask,
    info: (label: string, meta?: LogMeta, ctx?: LogContext) =>
      info(base, label, meta, ctx),
    debug: (label: string, meta?: LogMeta, ctx?: LogContext) =>
      debug(base, label, meta, ctx),
    warn: (label: string, meta?: LogMeta, ctx?: LogContext) =>
      warn(base, label, meta, ctx),
    error: (label: string, meta?: LogMeta, ctx?: LogContext) =>
      error(base, label, meta, ctx),

    printRunHeader: (startedAtIso: string) =>
      printHeader({
        jobId: options.jobId,
        runId: options.runId,
        runnerId: options.runnerId,
        startedAt: startedAtIso,
        surveyline: options.surveyline,
        automationType: options.automationType,
        translation: options.translation,
      }),
    taskStart: async (taskName: string, target?: string) => {
      startTask(taskName, target);
      await info(base, "task_start", { taskName, target });
    },
    taskEnd: async (taskName: string, result: string) => {
      await info(base, "task_end", { taskName, result });
    },
  };
}
