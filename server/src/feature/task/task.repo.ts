import { db } from "@server/db/client";
import { tasks, taskLogs, type TaskLog } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { TaskLogs as TaskLogsType } from "./task.types";
import { randomUUID } from "node:crypto";

export const getTaskLogsByRunId = async (
  runId: string,
): Promise<TaskLogsType | null> => {
  const taskRows = await db.select().from(tasks).where(eq(tasks.runId, runId));

  if (!taskRows || taskRows.length === 0) return null;

  const tasksWithLogs = await Promise.all(
    taskRows.map(async (t) => {
      const logRows = await db
        .select()
        .from(taskLogs)
        .where(eq(taskLogs.taskId, t.id));

      const logs: Array<{ status: string; action: string }> = [];
      for (const r of logRows) {
        try {
          const parsed = JSON.parse(r.logs as string);
          if (Array.isArray(parsed)) logs.push(...parsed);
        } catch (e) {
          // ignore malformed JSON
        }
      }

      return {
        taskId: t.id,
        fieldName: t.fieldName,
        logs,
      };
    }),
  );

  const result: TaskLogsType = {
    taskLogsId: `tasklogs-${runId}`,
    runId,
    tasks: tasksWithLogs,
  };

  return result;
};

export const createTaskLogs = async (data: TaskLog) => {
  // If there's already a row for this taskId, delegate to upsert (merge/update)
  const existing = await db
    .select()
    .from(taskLogs)
    .where(eq(taskLogs.taskId, data.taskId));

  if (existing && existing.length > 0) {
    return upsertTaskLogs(data);
  }

  const id = data.id;
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
  // Find existing row for taskId
  const existing = await db
    .select()
    .from(taskLogs)
    .where(eq(taskLogs.taskId, data.taskId));

  if (!existing || existing.length === 0) {
    // No existing row, create new
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
  }

  // Merge logs arrays: append incoming entries to existing
  const row = existing[0]!;
  let existingLogs: any[] = [];
  try {
    const parsed = JSON.parse((row?.logs as string) ?? "[]");
    if (Array.isArray(parsed)) existingLogs = parsed;
  } catch (e) {
    existingLogs = [];
  }

  const merged = existingLogs.concat(data.logs ?? []);

  await db
    .update(taskLogs)
    .set({ logs: JSON.stringify(merged) })
    .where(eq(taskLogs.taskId, data.taskId));

  return {
    id: row.id,
    taskId: data.taskId,
    logs: merged,
  } as TaskLog;
};

export const deleteTaskLogs = async (id: string): Promise<void> => {
  await db.delete(taskLogs).where(eq(taskLogs.id, id));
};
