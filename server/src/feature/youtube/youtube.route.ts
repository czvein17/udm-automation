import { Hono } from "hono";
import {
  createTaskMultipleSchema,
  createTaskSchema,
  type ApiResponse,
} from "shared/dist";
import {
  createTask,
  getTask,
  openYoutube,
  openYoutubeMultiple,
  getTaskByRunID,
  getTaskList,
} from "./youtube.handler";
import { zValidator } from "@hono/zod-validator";
import { zodThrow } from "../../middleware/zodThrow";

export const youtubeRoute = new Hono()
  .post("/open", zodThrow(createTaskSchema, "json"), openYoutube)
  .post(
    "/open-multiple",
    zodThrow(createTaskMultipleSchema, "json"),
    openYoutubeMultiple,
  )

  .get("/task-list/:runId", getTaskList)

  .get("/task", getTask)
  .get("/task/:runId", getTaskByRunID)
  .post("/task", zodThrow(createTaskSchema, "json"), createTask);

// .get("/", async (c) => {
//   const data: ApiResponse<null> = {
//     message: "Hello YouTube!",
//     success: true,
//     data: null,
//   };

//   return c.json(data, { status: 200 });
// });
