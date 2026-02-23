import type { Context } from "hono";

import type { Task } from "@server/db/schema";
import {
  respondNotFound,
  respondOk,
  respondEmptyList,
} from "@server/util/apiResponse.util";

import { startAutomationRun } from "./automation.service";

import * as automationService from "./automation.service";

export async function openAutomation(c: Context) {
  const payload = await c.req.json();

  const result: {
    runId: string;
  } = await startAutomationRun(payload);

  return respondOk(c, result, "Automation run started successfully");
}

export async function openAutomationMultiple(c: Context) {
  const payload = await c.req.json();

  const results: {
    runId: string;
  } = await automationService.openAutomationMultiple(payload);

  return respondOk(c, results, "Automation run started successfully");
}

export async function getTaskList(c: Context) {
  const runId = c.req.param("runId").trim();
  const result: Task[] = await automationService.getTasksByRunId(runId);

  if (!result.length) {
    return respondEmptyList<Task>(c, `No tasks found for runId ${runId}`);
  }

  return respondOk(c, result, "Tasks retrieved successfully");
}

export async function getTask(c: Context) {
  const result: Task[] = await automationService.getTasks();

  if (!result.length) {
    return respondEmptyList<Task>(c, "No tasks found");
  }

  return respondOk(c, result, "Tasks retrieved successfully");
}

export async function getTaskByRunID(c: Context) {
  const runId = c.req.param("runId").trim();

  type TTask = Task | null;
  const task: TTask = await automationService.getTaskByRunId(runId);

  if (!task) {
    return respondNotFound(c, `Task with runId ${runId} not found`);
  }

  return respondOk(c, task, "Task retrieved successfully");
}

export async function createTask(c: Context) {
  const payload = await c.req.json();

  type TTask = Task | null;

  const task: TTask = await automationService.createTask(payload);

  return respondOk(c, task, "Task created successfully");
}
