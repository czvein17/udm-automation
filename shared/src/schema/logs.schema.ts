import { z } from "zod";

export const logLevels = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof logLevels)[number];

export const logContextSchema = z.object({
  fieldName: z.string().optional(),
  elementId: z.string().optional(),
  elementName: z.string().optional(),
  displayName: z.string().optional(),
  tableName: z.string().optional(),
  url: z.string().optional(),
  rowIndex: z.number().int().nonnegative().optional(),
  taskId: z.string().optional(),
  surveyline: z.string().optional(),
  automationType: z.string().optional(),
});

export type LogContext = z.infer<typeof logContextSchema>;

export const logEventSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  jobId: z.string().optional(),
  runnerId: z.string().optional(),
  ts: z.string().datetime(),
  level: z.enum(logLevels),
  message: z.string().min(1),
  meta: z.record(z.string(), z.unknown()).optional(),
  ctx: logContextSchema.optional(),
  raw: z.string().optional(),
  source: z.enum(["automation", "server"]),
});

export type LogEvent = z.infer<typeof logEventSchema>;
