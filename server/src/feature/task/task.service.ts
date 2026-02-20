import type { TaskLog, TaskLogs } from "./task.types";
import * as TaskRepo from "./task.repo";
import * as LogRepo from "../logs/logs.repo";
import type { CreateTaskLog } from "shared";
import { nanoid } from "nanoid";

export const getTaskLogsByRunId = async (
  runId: string,
): Promise<TaskLogs | null> => {
  return TaskRepo.getTaskLogsByRunId(runId);
};

type newTaskLog = {
  id: string;
  taskId: string;
  logs: {
    status: "success" | "loading" | "failed" | "error" | string;
    action: string;
  }[];
};

export const createTaskLogs = async (payload: CreateTaskLog) => {
  const data: newTaskLog = {
    id: nanoid(),
    taskId: payload.taskId,
    logs: payload.logs,
  };

  const created = await TaskRepo.createTaskLogs(data as any);

  return created;
};

export const deleteTaskLogs = async (id: string): Promise<void> => {
  await TaskRepo.deleteTaskLogs(id);
};

export const deleteTask = async () => {
  await TaskRepo.deleteAllTaskLogs();
  await TaskRepo.deleteAllTask();
  await LogRepo.deleteAllLogs();
};
