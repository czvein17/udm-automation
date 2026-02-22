import { db } from "@server/db/client";
import { tasks, taskLogs, type TaskLog } from "@server/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { TaskLogs as TaskLogsType } from "./task.types";
import { randomUUID } from "node:crypto";

export const getTaskLogsByRunId = async (
  runId: string,
): Promise<TaskLogsType | null> => {
  const taskRows = await db.select().from(tasks).where(eq(tasks.runId, runId));

  if (!taskRows || taskRows.length === 0) return null;

  const taskIds = taskRows.map((task) => task.id);
  const logRows =
    taskIds.length > 0
      ? await db.select().from(taskLogs).where(inArray(taskLogs.taskId, taskIds))
      : [];

  const logsByTaskId = new Map<string, Array<{ status: string; action: string }>>();

  for (const row of logRows) {
    if (!row.taskId) continue;

    const bucket = logsByTaskId.get(row.taskId) ?? [];

    try {
      const parsed = JSON.parse(row.logs as string);
      if (Array.isArray(parsed)) {
        bucket.push(...parsed);
      }
    } catch {
      // ignore malformed JSON
    }

    logsByTaskId.set(row.taskId, bucket);
  }

  const tasksWithLogs = taskRows.map((task) => ({
    taskId: task.id,
    fieldName: task.fieldName,
    logs: logsByTaskId.get(task.id) ?? [],
  }));

  const result: TaskLogsType = {
    taskLogsId: `tasklogs-${runId}`,
    runId,
    tasks: tasksWithLogs,
  };

  return result;
};

export const createTaskLogs = async (data: TaskLog) => {
  const id = data.id ?? randomUUID();
  await db.insert(taskLogs).values({
    id,
    taskId: data.taskId,
    logs: JSON.stringify(data.logs),
  });

  return {
    id,
    taskId: data.taskId,
    logs: data.logs,
  } as TaskLog;
};

export const upsertTaskLogs = async (data: TaskLog) => {
  return createTaskLogs(data);
};

export const deleteTaskLogs = async (id: string): Promise<void> => {
  await db.delete(taskLogs).where(eq(taskLogs.id, id));
};

export const deleteAllTask = async () => {
  return await db.delete(tasks);
};

export const deleteAllTaskLogs = async () => {
  return await db.delete(taskLogs);
};
