import type { Context } from "hono";

import { db } from "@server/db/client";
import { tasks, type Task } from "@server/db/schema";
import { taskSchema } from "@server/db/schema";
import type { ApiResponse } from "shared/dist";

import { startOpenYoutubeRun } from "./youtube.service";

import * as ytService from "./youtube.service";

export async function openYoutube(c: Context) {
  const result = await startOpenYoutubeRun();
  return c.json(result, { status: 200 });
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
  const task: TTask = await ytService.getTaskByRunId(runId);

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

  const task: TTask = await ytService.createTask(payload);

  const data: ApiResponse<TTask> = {
    message: "Task created successfully",
    success: true,
    data: task,
  };

  return c.json(data, { status: 200 });
}
