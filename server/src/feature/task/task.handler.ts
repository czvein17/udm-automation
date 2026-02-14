import type { Context } from "hono";
import type { ApiResponse, CreateTaskLog } from "shared";
import * as taskService from "./task.service";

export const getTasksLogs = async (c: Context) => {
  const runId = c.req.param("runId");

  const taskLogs = await taskService.getTaskLogsByRunId(runId);

  const data: ApiResponse<any> = {
    message: "Successfully retrieved task logs for run ID: " + runId,
    success: true,
    data: taskLogs,
  };

  return c.json(data, { status: 200 });
};

export const createTaskLogs = async (c: Context) => {
  const payload = (await c.req.json()) as CreateTaskLog;

  const created = await taskService.createTaskLogs(payload);

  const data: ApiResponse<typeof created> = {
    message: "Task logs created/updated successfully",
    success: true,
    data: created,
  };

  return c.json(data, { status: 201 });
};

export const deleteTaskLogs = async (c: Context) => {
  const id = c.req.param("id");
  await taskService.deleteTaskLogs(id);
  return c.json({ message: "Task logs deleted successfully" }, { status: 200 });
};
