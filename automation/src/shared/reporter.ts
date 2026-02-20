import type {
  ReportEvent as SharedReportEvent,
  ReporterConfig,
  ReporterRowContext,
} from "shared";
import { makeLogger, type LogContext, type LogLevel } from "./logger";

type ReporterOptions = {
  runId: string;
  jobId: string;
  runnerId: string;
  config?: ReporterConfig;
  source?: "automation" | "server";
  transport?: ReporterTransport;
};

export type RowContext = ReporterRowContext;

type RowStepDetails = Record<string, unknown>;

type RowFailInput = {
  message: string;
  hint?: string;
};

export type ReportEvent =
  | Extract<SharedReportEvent, { type: "run_start" }>
  | Extract<SharedReportEvent, { type: "row_start" }>
  | Extract<SharedReportEvent, { type: "row_step" }>
  | Extract<SharedReportEvent, { type: "row_end" }>;

type ReporterTransport = {
  info: (
    message: string,
    meta?: Record<string, unknown>,
    ctx?: LogContext,
  ) => Promise<void>;
  warn: (
    message: string,
    meta?: Record<string, unknown>,
    ctx?: LogContext,
  ) => Promise<void>;
  error: (
    message: string,
    meta?: Record<string, unknown>,
    ctx?: LogContext,
  ) => Promise<void>;
  debug: (
    message: string,
    meta?: Record<string, unknown>,
    ctx?: LogContext,
  ) => Promise<void>;
};

function nowIso() {
  return new Date().toISOString();
}

function isDebugEnabled() {
  return String(process.env.DEBUG_LOGS ?? "").toLowerCase() === "true";
}

function asText(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function toLogContext(input: RowContext): LogContext {
  return {
    taskId: asText(input.taskId),
    fieldName: asText(input.fieldName),
    elementId: asText(input.elementId),
    elementName: asText(input.elementName),
    displayName: asText(input.displayName),
    tableName: asText(input.tableName),
    url: asText(input.url),
    rowIndex: input.rowIndex,
  };
}

type EmitInput = {
  level?: Exclude<LogLevel, "debug"> | "debug";
  event: ReportEvent;
  ctx?: LogContext;
};

export function createRunStartEvent(input: {
  runId: string;
  jobId: string;
  runnerId: string;
  config?: ReporterConfig;
  ts?: string;
}): Extract<ReportEvent, { type: "run_start" }> {
  return {
    type: "run_start",
    ts: input.ts ?? nowIso(),
    runId: input.runId,
    jobId: input.jobId,
    runnerId: input.runnerId,
    config: input.config,
  };
}

export function createRowStartEvent(input: {
  runId: string;
  rowIndex: number;
  ctx: RowContext;
  ts?: string;
}): Extract<ReportEvent, { type: "row_start" }> {
  return {
    type: "row_start",
    ts: input.ts ?? nowIso(),
    runId: input.runId,
    rowIndex: input.rowIndex,
    ctx: input.ctx,
  };
}

export function createRowStepEvent(input: {
  runId: string;
  rowIndex: number;
  title: string;
  details?: RowStepDetails;
  ts?: string;
}): Extract<ReportEvent, { type: "row_step" }> {
  return {
    type: "row_step",
    ts: input.ts ?? nowIso(),
    runId: input.runId,
    rowIndex: input.rowIndex,
    title: input.title,
    details: input.details,
  };
}

export function createRowEndEvent(input: {
  runId: string;
  rowIndex: number;
  status: "ok" | "fail";
  summary?: string;
  error?: { code: string; message: string; hint?: string };
  ts?: string;
}): Extract<ReportEvent, { type: "row_end" }> {
  return {
    type: "row_end",
    ts: input.ts ?? nowIso(),
    runId: input.runId,
    rowIndex: input.rowIndex,
    status: input.status,
    summary: input.summary,
    error: input.error,
  };
}

export function createReporter(options: ReporterOptions) {
  const transport: ReporterTransport =
    options.transport ??
    makeLogger({
      runId: options.runId,
      jobId: options.jobId,
      runnerId: options.runnerId,
      source: options.source ?? "automation",
      surveyline: options.config?.surveyline,
      automationType: options.config?.automationType,
      translation: options.config?.translation,
    });

  const runCtx: LogContext = {
    surveyline: options.config?.surveyline,
    automationType: options.config?.automationType,
  };

  async function emit(input: EmitInput) {
    const level = input.level ?? "info";
    const ctx = {
      ...runCtx,
      ...(input.ctx ?? {}),
    };
    const meta = input.event as Record<string, unknown>;

    if (level === "debug") {
      if (!isDebugEnabled()) return;
      await transport.debug(input.event.type, meta, ctx);
      return;
    }

    if (level === "warn") {
      await transport.warn(input.event.type, meta, ctx);
      return;
    }

    if (level === "error") {
      await transport.error(input.event.type, meta, ctx);
      return;
    }

    await transport.info(input.event.type, meta, ctx);
  }

  async function runStart() {
    const event = createRunStartEvent({
      runId: options.runId,
      jobId: options.jobId,
      runnerId: options.runnerId,
      config: options.config,
    });

    await emit({
      event,
    });
  }

  function row(rowInput: RowContext) {
    const rowCtx = toLogContext(rowInput);
    let started = false;
    let ended = false;

    async function ensureStart() {
      if (started) return;
      started = true;

      const event = createRowStartEvent({
        runId: options.runId,
        rowIndex: rowInput.rowIndex,
        ctx: rowInput,
      });

      await emit({
        event,
        ctx: rowCtx,
      });
    }

    return {
      step: async (title: string, details?: RowStepDetails) => {
        await ensureStart();

        const event = createRowStepEvent({
          runId: options.runId,
          rowIndex: rowInput.rowIndex,
          title,
          details,
        });

        await emit({
          event,
          ctx: rowCtx,
        });
      },
      warn: async (title: string, details?: RowStepDetails) => {
        await ensureStart();

        const event = createRowStepEvent({
          runId: options.runId,
          rowIndex: rowInput.rowIndex,
          title,
          details,
        });

        await emit({
          level: "warn",
          event,
          ctx: rowCtx,
        });
      },
      ok: async (summary?: string) => {
        if (ended) return;
        await ensureStart();
        ended = true;

        const event = createRowEndEvent({
          runId: options.runId,
          rowIndex: rowInput.rowIndex,
          status: "ok",
          summary,
        });

        await emit({
          event,
          ctx: rowCtx,
        });
      },
      fail: async (code: string, error: RowFailInput) => {
        if (ended) return;
        await ensureStart();
        ended = true;

        const event = createRowEndEvent({
          runId: options.runId,
          rowIndex: rowInput.rowIndex,
          status: "fail",
          summary: code,
          error: {
            code,
            message: error.message,
            hint: error.hint,
          },
        });

        await emit({
          level: "error",
          event,
          ctx: rowCtx,
        });
      },
    };
  }

  return {
    runStart,
    row,
    // Migration note:
    // old: logger.info(label, meta, ctx)
    // new: row.step("Title", { ...details })
  };
}

export type Reporter = ReturnType<typeof createReporter>;
export type RowReporter = ReturnType<Reporter["row"]>;
