import { z } from "zod";

export const elementRowSchema = z.object({
  id: z.number().int().positive(),

  fieldName: z.string().trim().min(1, "Field Name is required"),
  elementId: z.string().trim().min(1, "Element ID is required"),
  tableName: z.string().trim().min(1, "Table Name is required"),

  elementName: z.string().trim().optional().or(z.literal("")).optional(),

  displayName: z.string().trim().min(1, "Display Name is required"),
});

export const elementRowsSchema = z.array(elementRowSchema);

export type ElementRow = z.infer<typeof elementRowSchema>;
