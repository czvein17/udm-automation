import { db } from "@server/db/client";
import { eq } from "drizzle-orm";
import { tasks, type Task } from "@server/db/schema";
import { runAutomationJob } from "@server/runners/automation.runner";
import { createRun } from "@server/stores/run.store";
import { nanoid } from "nanoid";
import type { CreateTask } from "shared/dist";
import { ru } from "zod/locales";

export async function startOpenYoutubeRun(fieldNames?: string[]) {
  const runId = nanoid();
  const jobId = "open-youtube";

  createRun(runId, jobId);

  // fire-and-forget; logs will stream into store
  runAutomationJob({ runId, jobId });
  return { runId };
}

export const createTask = async (payload: CreateTask): Promise<Task | null> => {
  console.log(payload);

  const runId = nanoid();
  const jobId = "open-youtube";

  createRun(runId, jobId);
  const newTask: Task = {
    id: nanoid(),
    runId: runId,
    ...payload,
  };

  const task = await db.insert(tasks).values(newTask).returning();

  return task[0] ?? null;
};

export const getTaskByRunId = async (runId: string): Promise<Task | null> => {
  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.runId, runId))
    .limit(1);

  return task[0] ?? null;
};
