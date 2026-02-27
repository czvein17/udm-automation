import { Hono } from "hono";
import { clearTask } from "./task.handler";

export const taskRoutes = new Hono()
  .delete("/del-all", clearTask);
