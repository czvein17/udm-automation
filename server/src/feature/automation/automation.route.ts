import { Hono } from "hono";
import { createTaskMultipleSchema, createTaskSchema } from "shared/dist";
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
  .post("/open", zodThrow(createTaskSchema, "json"), openAutomation)
  .post(
    "/open-multiple",
    zodThrow(createTaskMultipleSchema, "json"),
    openAutomationMultiple,
  )

  .post("/task", zodThrow(createTaskSchema, "json"), createTask)
  .get("/task", getTask)
  .get("/task/:runId", getTaskByRunID)
  .get("/task-list/:runId", getTaskList);
