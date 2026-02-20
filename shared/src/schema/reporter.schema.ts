import { z } from "zod";

export const reporterConfigSchema = z
  .object({
    surveyline: z.string().optional(),
    automationType: z.string().optional(),
    translation: z.string().optional(),
  })
  .strict();

export const reporterRowContextSchema = z
  .object({
    rowIndex: z.number().int().nonnegative(),
    taskId: z.string().optional(),
    fieldName: z.string().optional(),
    elementId: z.string().optional(),
    elementName: z.string().optional(),
    displayName: z.string().optional(),
    tableName: z.string().optional(),
    url: z.string().optional(),
  })
  .strict();

export const reportRunStartSchema = z
  .object({
    type: z.literal("run_start"),
    ts: z.string().datetime(),
    runId: z.string().min(1),
    jobId: z.string().min(1),
    runnerId: z.string().min(1),
    config: reporterConfigSchema.optional(),
  })
  .strict();

export const reportRowStartSchema = z
  .object({
    type: z.literal("row_start"),
    ts: z.string().datetime(),
    runId: z.string().min(1),
    rowIndex: z.number().int().nonnegative(),
    ctx: reporterRowContextSchema,
  })
  .strict();

export const reportRowStepSchema = z
  .object({
    type: z.literal("row_step"),
    ts: z.string().datetime(),
    runId: z.string().min(1),
    rowIndex: z.number().int().nonnegative(),
    title: z.string().min(1),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const reportRowEndSchema = z
  .object({
    type: z.literal("row_end"),
    ts: z.string().datetime(),
    runId: z.string().min(1),
    rowIndex: z.number().int().nonnegative(),
    status: z.enum(["ok", "fail"]),
    summary: z.string().optional(),
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
        hint: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const reportEventSchema = z.discriminatedUnion("type", [
  reportRunStartSchema,
  reportRowStartSchema,
  reportRowStepSchema,
  reportRowEndSchema,
]);

export type ReporterConfig = z.infer<typeof reporterConfigSchema>;
export type ReporterRowContext = z.infer<typeof reporterRowContextSchema>;
export type ReportRunStartEvent = z.infer<typeof reportRunStartSchema>;
export type ReportRowStartEvent = z.infer<typeof reportRowStartSchema>;
export type ReportRowStepEvent = z.infer<typeof reportRowStepSchema>;
export type ReportRowEndEvent = z.infer<typeof reportRowEndSchema>;
export type ReportEvent = z.infer<typeof reportEventSchema>;
