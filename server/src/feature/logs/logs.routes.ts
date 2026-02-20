import { Hono } from "hono";
import { createRunLog, getRunLogs } from "./logs.handler";

export const logsRoutes = new Hono()
  .get("/runs/:runId/logs", getRunLogs)
  .post("/runs/:runId/logs", createRunLog);
