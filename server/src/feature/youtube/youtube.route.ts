import { Hono } from "hono";
import { createTaskSchema, type ApiResponse } from "shared/dist";
import {
  createTask,
  getTask,
  openYoutube,
  getTaskByRunID,
} from "./youtube.handler";
import { zValidator } from "@hono/zod-validator";
import { zodThrow } from "../../middleware/zodThrow";

export const youtubeRoute = new Hono()
  .post("/open", openYoutube)
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
