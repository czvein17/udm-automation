import type { Context } from "hono";

import type { CreateAutomationEventBody, UpdateAutomationRunStatusBody } from "shared";
import {
  respondCreated,
  respondNotFound,
  respondOk,
} from "@server/util/apiResponse.util";
import {
  createAutomationEvent,
  getAutomationTerminalEventsPage,
  getAutomationTerminalSnapshot,
  updateAutomationRunStatus,
} from "./automationTerminal.service";
import {
  broadcastAutomationTerminalEvent,
  broadcastAutomationTerminalState,
} from "./automationTerminal.ws";

function getRunId(c: Context) {
  return c.req.param("runId").trim();
}

export async function postAutomationTerminalEvent(c: Context) {
  const runId = getRunId(c);

  const body = (await c.req.json()) as CreateAutomationEventBody;

  const event = await createAutomationEvent({ runId, body });
  if (!event) return respondNotFound(c, "Automation run not found");

  broadcastAutomationTerminalEvent(runId);

  return respondCreated(c, event, "Automation event stored");
}

export async function getAutomationTerminalSnapshotHandler(c: Context) {
  const runId = getRunId(c);

  const limitParam = c.req.query("limit");
  const beforeSeqParam = c.req.query("beforeSeq");

  const snapshot = await getAutomationTerminalSnapshot({
    runId,
    limitParam,
    beforeSeqParam,
  });
  if (!snapshot) return respondNotFound(c, "Automation run not found");

  return respondOk(c, snapshot, "Automation terminal snapshot fetched");
}

export async function getAutomationTerminalEventsPageHandler(c: Context) {
  const runId = getRunId(c);

  const limitParam = c.req.query("limit");
  const beforeSeqParam = c.req.query("beforeSeq");

  const eventsPage = await getAutomationTerminalEventsPage({
    runId,
    limitParam,
    beforeSeqParam,
  });
  if (!eventsPage) return respondNotFound(c, "Automation run not found");

  return respondOk(c, eventsPage, "Automation terminal events fetched");
}

export async function patchAutomationTerminalRunStatus(c: Context) {
  const runId = getRunId(c);

  const body = (await c.req.json()) as UpdateAutomationRunStatusBody;

  const run = await updateAutomationRunStatus({
    runId,
    status: body.status,
  });
  if (!run) return respondNotFound(c, "Automation run not found");

  broadcastAutomationTerminalState(runId);

  return respondOk(c, run, "Automation run status updated");
}
