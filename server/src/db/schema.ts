import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import z, { string, uuid } from "zod";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().unique(),
  runId: text("runId").notNull(),
  fieldName: text("fieldName").notNull(),
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
