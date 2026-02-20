import { z } from "zod";
export {
  logLevels,
  logContextSchema,
  logEventSchema,
  type LogContext,
  type LogEvent,
  type LogLevel,
} from "shared";

export const postLogLineSchema = z.object({
  line: z.string().min(1),
  runId: z.string().optional(),
  jobId: z.string().optional(),
  runnerId: z.string().optional(),
});

export type PostLogLineInput = z.infer<typeof postLogLineSchema>;
