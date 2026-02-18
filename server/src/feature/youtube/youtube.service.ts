import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

import { db } from "@server/db/client";
import { tasks, type Task } from "@server/db/schema";
import { runAutomationJob } from "@server/runners/automation.runner";
import { createRun } from "@server/stores/run.store";

import * as YTRepo from "./youtube.repositories";
import type { CreateTask } from "shared/dist";

export async function startOpenYoutubeRun(
  payload: CreateTask,
): Promise<{ runId: string }> {
  const runId = nanoid();
  const jobId = "open-youtube";

  createRun(runId, jobId);

  const newTask: Task = {
    id: nanoid(),
    runId: runId,
    fieldName: payload.fieldName,
    elementId: payload.elementId,
    tableName: payload.tableName,
    elementName: payload.elementName,
    displayName: payload.displayName,
  };

  await YTRepo.createTask(newTask);

  runAutomationJob({ runId, jobId });

  return { runId };
}

export async function openYtTabsMultiple(
  payloads: CreateTask[],
): Promise<{ runId: string }> {
  const runId = nanoid();
  const jobId = "udm-automation";

  const newTasks = payloads.map((payload) => ({
    id: nanoid(),
    runId: runId,
    fieldName: payload.fieldName,
    elementId: payload.elementId,
    tableName: payload.tableName,
    elementName: payload.elementName,
    displayName: payload.displayName,
  }));

  await YTRepo.createTaskMultiple(newTasks);

  runAutomationJob({ runId, jobId });

  return { runId };
}

export async function getTasksByRunId(runId: string): Promise<Task[]> {
  const TaskList = await YTRepo.getTaskListByRunId(runId);
  return TaskList;
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

export const getTasks = async (): Promise<Task[]> => {
  return await db.select().from(tasks);
};

export const getTaskByRunId = async (runId: string): Promise<Task | null> => {
  console.log("Getting Task ID: ", runId);

  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.runId, runId))
    .limit(1);

  return task[0] ?? null;
};
