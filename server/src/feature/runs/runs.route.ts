import { Hono } from "hono";
import { getAllRunByRunId, getRunById } from "./runs.handler";

export const runsRoutes = new Hono()
  .get("/", getAllRunByRunId)
  .get("/:runId", getRunById);
