import { Hono } from "hono";
import type { ApiResponse } from "shared/dist";
import { openYoutube } from "./youtube.handler";

export const youtubeRoute = new Hono()
  .post("/open", openYoutube)
  .get("/", async (c) => {
    const data: ApiResponse = {
      message: "Hello YouTube!",
      success: true,
    };

    return c.json(data, { status: 200 });
  });
