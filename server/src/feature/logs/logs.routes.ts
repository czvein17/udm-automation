import { Hono } from "hono";
import { createReporterEvent, getReporterEvents } from "./logs.handler";

export const reporterRoutes = new Hono()
  .get("/runs/:runId/events", getReporterEvents)
  .post("/runs/:runId/events", createReporterEvent);
