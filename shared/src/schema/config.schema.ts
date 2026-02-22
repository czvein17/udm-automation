import { z } from "zod";

export const configForValues = ["udm", "axis", "youtube"] as const;
export type ConfigFor = (typeof configForValues)[number];

export const configSchema = z.object({
  id: z.string().uuid(),
  configFor: z.enum(configForValues),
  baseUrl: z.string().nullable().optional(),
  surveyline: z.string().nullable().optional(),
  automationType: z
    .enum([
      "udm:open_elem",
      "udm:re-approve",
      "udm:edit_attributes",
      "udm:edit_applicabilities",
    ])
    .default("udm:open_elem"),
  translation: z.string().default("English"),
  autoCloseBrowser: z.boolean().default(false),
  autoCloseTaskPage: z.boolean().default(false),
});

export const createConfigSchema = configSchema.omit({ id: true });
export const updateConfigSchema = createConfigSchema.partial();

export type CreateConfig = z.infer<typeof createConfigSchema>;
export type UpdateConfig = z.infer<typeof updateConfigSchema>;
