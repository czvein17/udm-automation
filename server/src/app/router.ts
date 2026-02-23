import { Hono } from "hono";

import { automationRoute } from "@server/feature/automation/automation.route";
import { automationTerminalRoutes } from "@server/feature/automationTerminal/automationTerminal.routes";
import { taskRoutes } from "@server/feature/task/task.route";
import { configRoute } from "@server/feature/config/config.route";

export const appRouter = new Hono()
  .get("/", (c) => c.json({ message: "Hello from the main app router!" }))
  .route("/automation", automationRoute)
  .route("/automation", automationTerminalRoutes)
  .route("/tasks", taskRoutes)
  .route("/configs", configRoute);
