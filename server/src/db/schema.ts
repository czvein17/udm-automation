import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { z, string, uuid } from "zod";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().unique(),
  runId: text("runId").notNull(),
  fieldName: text("fieldName").notNull(),
  elementId: text("elementId").notNull(),
  tableName: text("tableName").notNull(),
  elementName: text("elementName"),
  displayName: text("displayName"),
});

export const taskLogs = sqliteTable(
  "task_logs",
  {
    id: text("id").primaryKey().unique(),
    taskId: text("taskId").references(() => tasks.id),
    logs: text("logs").notNull(),
  },
  (table) => ({
    taskIdIdx: index("idx_task_logs_task_id").on(table.taskId),
  }),
);

export const taskSchema = z.object({
  id: uuid(),
  runId: string(),
  fieldName: string(),
  elementId: string(),
  tableName: z
    .enum([
      "COMPANYDATA",
      "SUBMISSIONGRANT",
      "SUBMISSIONCOMPANY",
      "SUBMISSIONCONTACT",
      "SUBMISSIONINCUMBENT",
      "SUBMISSIONUNIT",
    ])
    .transform((val) => (val as string).toUpperCase()),
  elementName: string().nullable().optional(),
  displayName: string().nullable().optional(),
});

export const taskLogSchema = z.object({
  id: uuid(),
  taskId: string(),
  logs: z.array(
    z.object({
      status: z.enum(["success", "failed", "loading", "error"]),
      action: string(),
    }),
  ),
});

export type Task = z.infer<typeof taskSchema>;
export type TaskLog = z.infer<typeof taskLogSchema>;

export const config = sqliteTable("config", {
  id: text("id").primaryKey().unique(),
  configFor: text("configFor").notNull().unique(),

  baseUrl: text("baseUrl"),
  surveyline: text("surveyline"),

  automationType: text("automationType").notNull().default("udm:open_elem"),
  translation: text("translation").notNull().default("English"),
});

export const automationLogs = sqliteTable(
  "automation_logs",
  {
    id: text("id").primaryKey().unique(),
    runId: text("runId").notNull(),
    jobId: text("jobId"),
    runnerId: text("runnerId"),
    ts: text("ts").notNull(),
    level: text("level").notNull(),
    message: text("message").notNull(),
    metaJson: text("metaJson"),
    raw: text("raw"),
    seq: integer("seq").notNull(),
  },
  (table) => ({
    runSeqIdx: index("idx_automation_logs_run_seq").on(table.runId, table.seq),
    runTsIdx: index("idx_automation_logs_run_ts").on(table.runId, table.ts),
  }),
);

export const reporterRunSummaries = sqliteTable(
  "reporter_run_summaries",
  {
    runId: text("runId").primaryKey(),
    jobId: text("jobId"),
    runnerId: text("runnerId"),
    firstTs: text("firstTs").notNull(),
    lastTs: text("lastTs").notNull(),
    totalEvents: integer("totalEvents").notNull().default(0),
    errorCount: integer("errorCount").notNull().default(0),
    warnCount: integer("warnCount").notNull().default(0),
    status: text("status").notNull().default("running"),
    latestMessage: text("latestMessage").notNull(),
    lastSeq: integer("lastSeq").notNull().default(0),
  },
  (table) => ({
    lastSeqIdx: index("idx_reporter_run_summaries_last_seq").on(table.lastSeq),
    lastTsIdx: index("idx_reporter_run_summaries_last_ts").on(table.lastTs),
  }),
);

export const configSchema = z.object({
  id: uuid(),
  configFor: z
    .enum(["udm", "axis", "youtube"])
    .transform((val) => val as string),
  baseUrl: string().nullable().optional(),
  surveyline: string().nullable().optional(),

  automationType: z
    .enum([
      "udm:open_elem",
      "udm:re-approve",
      "udm:edit_attributes",
      "udm:edit_applicabilities",
    ])
    .default("udm:open_elem")
    .transform((val) => val as string),

  translation: z.string().default("English"),
});

export type Config = z.infer<typeof configSchema>;
