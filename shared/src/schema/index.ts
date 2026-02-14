import { taskLogSchema, taskSchema } from "server/dist/db/schema";
import { z as zod } from "zod";
import zType from "zod";
// TASK
export const createTaskSchema = taskSchema.omit({ id: true, runId: true });

export const createTaskMultipleSchema = zod.array(createTaskSchema);

export type CreateTask = zType.infer<typeof createTaskSchema>;

// TAKS LOGS

export const createTaskLogsSchema = taskLogSchema.omit({ id: true });

export type CreateTaskLog = zType.infer<typeof createTaskLogsSchema>;
