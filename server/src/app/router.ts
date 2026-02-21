import { Hono } from "hono";

import { automationRoute } from "@server/feature/automation/automation.route";
import { taskRoutes } from "@server/feature/task/task.route";
import { configRoute } from "@server/feature/config/config.route";
import { reporterRoutes } from "@server/feature/logs/logs.routes";

export const appRouter = new Hono()
  .get("/", (c) => c.json({ message: "Hello from the main app router!" }))
  .route("/automation", automationRoute)
  .route("/reporter", reporterRoutes)
  .route("/tasks", taskRoutes)
  .route("/configs", configRoute);
