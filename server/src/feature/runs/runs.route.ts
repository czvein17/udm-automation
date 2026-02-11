import { Hono } from "hono";
import { getRunById } from "./runs.handler";

export const runsRoutes = new Hono().get("/:runId", getRunById);
