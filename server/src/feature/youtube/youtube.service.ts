import { runAutomationJob } from "@server/runners/automation.runner";
import { createRun } from "@server/stores/run.store";
import { nanoid } from "nanoid";

export async function startOpenYoutubeRun(fieldNames?: string[]) {
  const runId = nanoid();
  const jobId = "open-youtube";

  createRun(runId, jobId);

  // fire-and-forget; logs will stream into store
  runAutomationJob({ runId, jobId });
  return { runId };
}
