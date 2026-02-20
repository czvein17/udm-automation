import { makeLogger, type AutomationLogger, type LogContext } from "./logger";

type FeatureLoggerOptions = {
  runId: string;
  jobId: string;
  runnerId: string;
  source?: "automation" | "server";
  surveyline?: string;
  automationType?: string;
  translation?: string;
  defaultCtx?: LogContext;
};

type LogMeta = Record<string, unknown>;

type FeatureLogger = AutomationLogger & {
  withContext: (ctx: LogContext) => {
    info: (label: string, meta?: LogMeta) => Promise<void>;
    debug: (label: string, meta?: LogMeta) => Promise<void>;
    warn: (label: string, meta?: LogMeta) => Promise<void>;
    error: (label: string, meta?: LogMeta) => Promise<void>;
  };
};

export function createFeatureLogger(
  options: FeatureLoggerOptions,
): FeatureLogger {
  const logger = makeLogger(options);

  const mergeCtx = (ctx?: LogContext) => ({
    ...(options.defaultCtx ?? {}),
    ...(ctx ?? {}),
  });

  return {
    ...logger,
    info: (label: string, meta?: LogMeta, ctx?: LogContext) =>
      logger.info(label, meta, mergeCtx(ctx)),
    debug: (label: string, meta?: LogMeta, ctx?: LogContext) =>
      logger.debug(label, meta, mergeCtx(ctx)),
    warn: (label: string, meta?: LogMeta, ctx?: LogContext) =>
      logger.warn(label, meta, mergeCtx(ctx)),
    error: (label: string, meta?: LogMeta, ctx?: LogContext) =>
      logger.error(label, meta, mergeCtx(ctx)),
    withContext: (ctx: LogContext) => ({
      info: (label: string, meta?: LogMeta) =>
        logger.info(label, meta, mergeCtx(ctx)),
      debug: (label: string, meta?: LogMeta) =>
        logger.debug(label, meta, mergeCtx(ctx)),
      warn: (label: string, meta?: LogMeta) =>
        logger.warn(label, meta, mergeCtx(ctx)),
      error: (label: string, meta?: LogMeta) =>
        logger.error(label, meta, mergeCtx(ctx)),
    }),
  };
}

export function buildTaskContext(input: {
  taskId?: string;
  fieldName?: string;
  elementId?: string;
  elementName?: string;
  displayName?: string;
  tableName?: string;
  surveyline?: string;
  automationType?: string;
}): LogContext {
  return {
    taskId: input.taskId,
    fieldName: input.fieldName,
    elementId: input.elementId,
    elementName: input.elementName,
    displayName: input.displayName,
    tableName: input.tableName,
    surveyline: input.surveyline,
    automationType: input.automationType,
  };
}
