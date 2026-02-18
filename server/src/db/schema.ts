import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
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

export const taskLogs = sqliteTable("task_logs", {
  id: text("id").primaryKey().unique(),
  taskId: text("taskId").references(() => tasks.id),
  logs: text("logs").notNull(),
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
