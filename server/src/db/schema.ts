import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
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

export type Task = z.infer<typeof taskSchema>;

export const automationRuns = sqliteTable("automation_runs", {
  id: text("id").primaryKey(),
  engine: text("engine").notNull().default("udm"),
  status: text("status").notNull().default("RUNNING"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const automationTasks = sqliteTable(
  "automation_tasks",
  {
    id: text("id").primaryKey(),
    runId: text("runId").notNull(),
    fieldName: text("fieldName"),
    elementId: text("elementId"),
    tableName: text("tableName"),
    elementName: text("elementName"),
    displayName: text("displayName"),
    url: text("url"),
  },
  (table) => ({
    runIdIdx: index("idx_automation_tasks_run_id").on(table.runId),
  }),
);

export const automationEvents = sqliteTable(
  "automation_events",
  {
    id: text("id").primaryKey(),
    runId: text("runId").notNull(),
    taskId: text("taskId").notNull(),
    seq: integer("seq").notNull(),
    type: text("type").notNull(),
    details: text("details").notNull(),
    payloadJson: text("payloadJson"),
    createdAt: text("createdAt").notNull(),
  },
  (table) => ({
    runSeqUniqueIdx: uniqueIndex("idx_automation_events_run_seq_unique").on(
      table.runId,
      table.seq,
    ),
    runSeqIdx: index("idx_automation_events_run_seq").on(
      table.runId,
      table.seq,
    ),
    runTaskSeqIdx: index("idx_automation_events_run_task_seq").on(
      table.runId,
      table.taskId,
      table.seq,
    ),
  }),
);

export const config = sqliteTable("config", {
  id: text("id").primaryKey().unique(),
  configFor: text("configFor").notNull().default("udm").unique(),

  baseUrl: text("baseUrl").default(
    "https://axis.ehr.com/en-US/survey-setup/surveys",
  ),
  surveyline: text("surveyline").default("48"),

  automationType: text("automationType").notNull().default("udm:open_elem"),
  translation: text("translation").notNull().default("English"),
});

export const configSchema = z.object({
  id: uuid(),
  configFor: z
    .enum(["udm", "axis", "youtube"])
    .default("udm")
    .transform((val) => val as string),
  baseUrl: string()
    .default("https://axis.ehr.com/en-US/survey-setup/surveys")
    .nullable()
    .optional(),
  surveyline: string().default("48").nullable().optional(),

  automationType: z
    .enum([
      "udm:open_elem",
      "udm:re-approve",
      "udm:edit_attributes",
      "udm:edit_applicabilities",
      "udm:copy_elements_to_another_cycle",
    ])
    .default("udm:open_elem")
    .transform((val) => val as string),

  translation: z.string().default("English"),
});

export type Config = z.infer<typeof configSchema>;
