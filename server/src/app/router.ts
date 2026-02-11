import { Hono } from "hono";

import { runsRoutes } from "@server/feature/runs/runs.route";
import { youtubeRoute } from "@server/feature/youtube/youtube.route";

export const appRouter = new Hono()
  .route("/youtube", youtubeRoute)
  .route("/runs", runsRoutes);
