import { Hono } from "hono";

import { runsRoutes } from "@server/feature/runs/runs.route";
import { youtubeRoute } from "@server/feature/youtube/youtube.route";
import { taskRoutes } from "@server/feature/task/task.route";

export const appRouter = new Hono()
  .route("/youtube", youtubeRoute)
  .route("/runs", runsRoutes)
  .route("/tasks", taskRoutes);
