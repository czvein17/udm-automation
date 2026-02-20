import { makeLogger, type LogContext, type LogLevel } from "./logger";

type ReporterConfig = {
  surveyline?: string;
  automationType?: string;
  translation?: string;
};

type ReporterOptions = {
  runId: string;
  jobId: string;
  runnerId: string;
  config?: ReporterConfig;
  source?: "automation" | "server";
};

export type RowContext = {
  rowIndex: number;
  taskId?: string;
  fieldName?: string;
  elementId?: string;
  elementName?: string;
  displayName?: string;
  tableName?: string;
  url?: string;
};

type RowStepDetails = Record<string, unknown>;

type RowFailInput = {
  message: string;
  hint?: string;
};

export type ReportEvent =
  | {
      type: "run_start";
      ts: string;
      runId: string;
      jobId: string;
      runnerId: string;
      config?: ReporterConfig;
    }
  | {
      type: "row_start";
      ts: string;
      runId: string;
      rowIndex: number;
      ctx: RowContext;
    }
  | {
      type: "row_step";
      ts: string;
      runId: string;
      rowIndex: number;
      title: string;
      details?: RowStepDetails;
    }
  | {
      type: "row_end";
      ts: string;
      runId: string;
      rowIndex: number;
      status: "ok" | "fail";
      summary?: string;
      error?: {
        code: string;
        message: string;
        hint?: string;
      };
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
  message: ReportEvent["type"];
  ctx?: LogContext;
  meta: Record<string, unknown>;
};

export function createReporter(options: ReporterOptions) {
  const logger = makeLogger({
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

    if (level === "debug") {
      if (!isDebugEnabled()) return;
      await logger.debug(input.message, input.meta, ctx);
      return;
    }

    if (level === "warn") {
      await logger.warn(input.message, input.meta, ctx);
      return;
    }

    if (level === "error") {
      await logger.error(input.message, input.meta, ctx);
      return;
    }

    await logger.info(input.message, input.meta, ctx);
  }

  async function runStart() {
    const ts = nowIso();
    const event: ReportEvent = {
      type: "run_start",
      ts,
      runId: options.runId,
      jobId: options.jobId,
      runnerId: options.runnerId,
      config: options.config,
    };

    await emit({
      message: "run_start",
      meta: event,
    });
  }

  function row(rowInput: RowContext) {
    const rowCtx = toLogContext(rowInput);
    let started = false;
    let ended = false;

    async function ensureStart() {
      if (started) return;
      started = true;

      const ts = nowIso();
      const event: ReportEvent = {
        type: "row_start",
        ts,
        runId: options.runId,
        rowIndex: rowInput.rowIndex,
        ctx: rowInput,
      };

      await emit({
        message: "row_start",
        ctx: rowCtx,
        meta: event,
      });
    }

    return {
      step: async (title: string, details?: RowStepDetails) => {
        await ensureStart();

        const ts = nowIso();
        const event: ReportEvent = {
          type: "row_step",
          ts,
          runId: options.runId,
          rowIndex: rowInput.rowIndex,
          title,
          details,
        };

        await emit({
          message: "row_step",
          ctx: rowCtx,
          meta: event,
        });
      },
      warn: async (title: string, details?: RowStepDetails) => {
        await ensureStart();

        const ts = nowIso();
        const event: ReportEvent = {
          type: "row_step",
          ts,
          runId: options.runId,
          rowIndex: rowInput.rowIndex,
          title,
          details,
        };

        await emit({
          level: "warn",
          message: "row_step",
          ctx: rowCtx,
          meta: event,
        });
      },
      ok: async (summary?: string) => {
        if (ended) return;
        await ensureStart();
        ended = true;

        const ts = nowIso();
        const event: ReportEvent = {
          type: "row_end",
          ts,
          runId: options.runId,
          rowIndex: rowInput.rowIndex,
          status: "ok",
          summary,
        };

        await emit({
          message: "row_end",
          ctx: rowCtx,
          meta: event,
        });
      },
      fail: async (code: string, error: RowFailInput) => {
        if (ended) return;
        await ensureStart();
        ended = true;

        const ts = nowIso();
        const event: ReportEvent = {
          type: "row_end",
          ts,
          runId: options.runId,
          rowIndex: rowInput.rowIndex,
          status: "fail",
          summary: code,
          error: {
            code,
            message: error.message,
            hint: error.hint,
          },
        };

        await emit({
          level: "error",
          message: "row_end",
          ctx: rowCtx,
          meta: event,
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
