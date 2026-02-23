import type { Context } from "hono";
import * as taskService from "./task.service";

export const clearTask = async (c: Context) => {
  await taskService.deleteTask();
  return c.json({ message: "All tasks cleared successfully" }, { status: 200 });
};
