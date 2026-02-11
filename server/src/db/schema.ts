import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import z, { string, uuid } from "zod";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().unique(),
  runId: text("runId").notNull(),
  fieldName: text("fieldName").notNull(),
});

export const taskSchema = z.object({
  id: uuid(),
  runId: string(),
  fieldName: string(),
});

export type Task = z.infer<typeof taskSchema>;
