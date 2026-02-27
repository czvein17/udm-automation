import { z } from "zod";

export const taskTableNameSchema = z
  .enum([
    "COMPANYDATA",
    "SUBMISSIONGRANT",
    "SUBMISSIONCOMPANY",
    "SUBMISSIONCONTACT",
    "SUBMISSIONINCUMBENT",
    "SUBMISSIONUNIT",
  ])
  .transform((value) => value as string);

export const taskSchema = z.object({
  id: z.string().uuid(),
  runId: z.string(),
  fieldName: z.string(),
  elementId: z.string(),
  tableName: taskTableNameSchema,
  elementName: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
});

export const createTaskSchema = taskSchema.omit({ id: true, runId: true });
export const createTaskMultipleSchema = z.array(createTaskSchema);

export type Task = z.infer<typeof taskSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
