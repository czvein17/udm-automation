import { Hono } from "hono";
import { createTaskMultipleSchema, createTaskSchema } from "shared";
import {
  requireJsonBody,
  requireParam,
} from "@server/middleware/requireInput";
import {
  createTask,
  getTask,
  openAutomation,
  openAutomationMultiple,
  getTaskByRunID,
  getTaskList,
} from "./automation.handler";

import { zodThrow } from "../../middleware/zodThrow";

export const automationRoute = new Hono()
  .post("/open", requireJsonBody(), zodThrow(createTaskSchema, "json"), openAutomation)
  .post(
    "/open-multiple",
    requireJsonBody(),
    zodThrow(createTaskMultipleSchema, "json"),
    openAutomationMultiple,
  )

  .post("/task", requireJsonBody(), zodThrow(createTaskSchema, "json"), createTask)
  .get("/task", getTask)
  .get("/task/:runId", requireParam("runId"), getTaskByRunID)
  .get("/task-list/:runId", requireParam("runId"), getTaskList);
