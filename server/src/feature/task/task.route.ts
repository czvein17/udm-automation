import { Hono } from "hono";
import { createTaskLogs, deleteTaskLogs, getTasksLogs } from "./task.handler";
import { zodThrow } from "@server/middleware/zodThrow";
import { createTaskLogsSchema } from "shared";

export const taskRoutes = new Hono()
  .get("/:runId/logs", getTasksLogs)
  .post("/logs", zodThrow(createTaskLogsSchema), createTaskLogs)
  .delete("/logs/:id", deleteTaskLogs);
