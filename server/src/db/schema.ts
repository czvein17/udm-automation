import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
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
    ])
    .default("udm:open_elem")
    .transform((val) => val as string),

  translation: z.string().default("English"),
});

export type Config = z.infer<typeof configSchema>;
