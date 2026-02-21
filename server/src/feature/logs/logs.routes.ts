import { Hono } from "hono";
import {
  createReporterEvent,
  deleteAllReporterEvents,
  deleteReporterRunEvents,
  getReporterEvents,
  getReporterRunHistory,
} from "./logs.handler";

export const reporterRoutes = new Hono()
  .get("/runs", getReporterRunHistory)
  .delete("/runs", deleteAllReporterEvents)
  .get("/runs/:runId/events", getReporterEvents)
  .post("/runs/:runId/events", createReporterEvent)
  .delete("/runs/:runId/events", deleteReporterRunEvents);
