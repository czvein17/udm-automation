import { eq } from "drizzle-orm";
import { db } from "@server/db/client";
import { tasks, type Task } from "@server/db/schema";

export const createTask = async (data: Task): Promise<Task | null> => {
  const task = await db.insert(tasks).values(data).returning();

  return task[0] || null;
};

export const createTaskMultiple = async (data: Task[]): Promise<Task[]> => {
  const newTasks = await db.insert(tasks).values(data).returning();

  return newTasks;
};

export const getTaskListByRunId = async (runId: string): Promise<Task[]> => {
  const tasksList = await db.select().from(tasks).where(eq(tasks.runId, runId));
  return tasksList;
};
