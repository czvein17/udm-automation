import { z } from "zod";

export const automationEventTypeSchema = z.enum([
  "navigate",
  "click",
  "fill",
  "validate",
  "edited",
  "success",
  "error",
]);

export const automationRunStatusSchema = z.enum([
  "RUNNING",
  "PAUSED",
  "CANCELLED",
  "SUCCESS",
  "ERROR",
]);

export const automationEventPayloadSchema = z
  .record(z.string(), z.unknown())
  .optional();

export const automationEventSchema = z.object({
  id: z.string(),
  runId: z.string(),
  taskId: z.string(),
  seq: z.number().int().positive(),
  type: automationEventTypeSchema,
  details: z.string().min(1),
  payload: automationEventPayloadSchema,
  createdAt: z.string(),
});

export const createAutomationEventBodySchema = automationEventSchema.omit({
  id: true,
  runId: true,
  seq: true,
  createdAt: true,
});

export const updateAutomationRunStatusBodySchema = z.object({
  status: automationRunStatusSchema,
});

export type AutomationEventType = z.infer<typeof automationEventTypeSchema>;
export type AutomationRunStatus = z.infer<typeof automationRunStatusSchema>;
export type AutomationEvent = z.infer<typeof automationEventSchema>;
export type CreateAutomationEventBody = z.infer<
  typeof createAutomationEventBodySchema
>;
export type UpdateAutomationRunStatusBody = z.infer<
  typeof updateAutomationRunStatusBodySchema
>;
