import type { Context } from "hono";

import { db } from "@server/db/client";
import { tasks, type Task } from "@server/db/schema";
import { taskSchema } from "@server/db/schema";
import type { ApiResponse } from "shared/dist";

import { startAutomationRun } from "./automation.service";

import * as automationService from "./automation.service";

export async function openAutomation(c: Context) {
  const payload = await c.req.json();

  const result: {
    runId: string;
  } = await startAutomationRun(payload);

  const data: ApiResponse<{ runId: string }> = {
    message: "Automation run started successfully",
    success: true,
    data: result,
  };

  return c.json(data, { status: 200 });
}

export async function openAutomationMultiple(c: Context) {
  const payload = await c.req.json();

  const results: {
    runId: string;
  } = await automationService.openAutomationMultiple(payload);

  const data: ApiResponse<{ runId: string }> = {
    message: "Automation run started successfully",
    success: true,
    data: results,
  };

  return c.json(data, { status: 200 });
}

export async function getTaskList(c: Context) {
  const runId = c.req.param("runId");
  const result: Task[] = await automationService.getTasksByRunId(runId);

  const data: ApiResponse<Task[]> = {
    message: "Tasks retrieved successfully",
    success: true,
    data: result,
  };

  return c.json(data, { status: 200 });
}

export async function getTask(c: Context) {
  const result: Task[] = await db.select().from(tasks);

  const data: ApiResponse<Task[]> = {
    message: "Tasks retrieved successfully",
    success: true,
    data: result,
  };

  return c.json(data, { status: 200 });
}

export async function getTaskByRunID(c: Context) {
  const runId = c.req.param("runId");

  type TTask = Task | null;
  const task: TTask = await automationService.getTaskByRunId(runId);

  if (!task) {
    const data: ApiResponse<TTask> = {
      message: `Task with runId ${runId} not found`,
      success: false,
      data: null,
    };

    return c.json(data, { status: 404 });
  }
  const data: ApiResponse<TTask> = {
    message: "Task retrieved successfully",
    success: true,
    data: task,
  };

  return c.json(data, { status: 200 });
}

export async function createTask(c: Context) {
  const payload = await c.req.json();

  type TTask = Task | null;

  const task: TTask = await automationService.createTask(payload);

  const data: ApiResponse<TTask> = {
    message: "Task created successfully",
    success: true,
    data: task,
  };

  return c.json(data, { status: 200 });
}
