import { Hono } from "hono";

import { runsRoutes } from "@server/feature/runs/runs.route";
import { youtubeRoute } from "@server/feature/youtube/youtube.route";
import { taskRoutes } from "@server/feature/task/task.route";
import { configRoute } from "@server/feature/config/config.route";
import { logsRoutes } from "@server/feature/logs/logs.routes";

export const appRouter = new Hono()
  .get("/", (c) => c.json({ message: "Hello from the main app router!" }))
  .route("/youtube", youtubeRoute)
  .route("/runs", runsRoutes)
  .route("/", logsRoutes)
  .route("/tasks", taskRoutes)
  .route("/configs", configRoute);
