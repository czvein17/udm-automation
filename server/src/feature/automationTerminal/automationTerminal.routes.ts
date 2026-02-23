import { Hono } from "hono";

import {
  requireJsonBody,
  requireParam,
} from "@server/middleware/requireInput";
import { zodThrow } from "@server/middleware/zodThrow";
import {
  createAutomationEventBodySchema,
  updateAutomationRunStatusBodySchema,
} from "shared";
import {
  getAutomationTerminalEventsPageHandler,
  getAutomationTerminalSnapshotHandler,
  patchAutomationTerminalRunStatus,
  postAutomationTerminalEvent,
} from "./automationTerminal.handler";

export const automationTerminalRoutes = new Hono()
  .post(
    "/runs/:runId/events",
    requireParam("runId"),
    requireJsonBody(),
    zodThrow(createAutomationEventBodySchema, "json"),
    postAutomationTerminalEvent,
  )
  .get("/runs/:runId/terminal", requireParam("runId"), getAutomationTerminalSnapshotHandler)
  .get(
    "/runs/:runId/terminal/events",
    requireParam("runId"),
    getAutomationTerminalEventsPageHandler,
  )
  .patch(
    "/runs/:runId/status",
    requireParam("runId"),
    requireJsonBody(),
    zodThrow(updateAutomationRunStatusBodySchema, "json"),
    patchAutomationTerminalRunStatus,
  );
