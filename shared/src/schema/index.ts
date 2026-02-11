import { taskSchema } from "server/dist/db/schema";
import type z from "zod";

export const createTaskSchema = taskSchema.omit({ id: true, runId: true });

export type CreateTask = z.infer<typeof createTaskSchema>;
