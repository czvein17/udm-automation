import type { Context } from "hono";
import type { ApiResponse } from "shared";
import { getLogs, insertLog } from "./logs.repo";
import { parsePostBody } from "./logs.parser";
import { broadcastReporterEvent } from "./logs.ws";

export const getReporterEvents = async (c: Context) => {
  const runId = c.req.param("runId");
  const cursorRaw = c.req.query("cursor");
  const limitRaw = c.req.query("limit");

  const cursor = cursorRaw ? Number(cursorRaw) : undefined;
  const limit = limitRaw ? Number(limitRaw) : 200;

  const result = await getLogs(
    runId,
    Number.isFinite(cursor) ? cursor : undefined,
    limit,
  );

  const data: ApiResponse<typeof result> = {
    message: "Reporter events retrieved successfully",
    success: true,
    data: result,
  };

  return c.json(data, 200);
};

export const createReporterEvent = async (c: Context) => {
  const runId = c.req.param("runId");
  const body = await c.req.json().catch(() => null);

  const event = parsePostBody(runId, body);
  if (!event) {
    return c.json(
      {
        message: "Invalid reporter event payload",
        success: false,
        data: null,
      } satisfies ApiResponse<null>,
      400,
    );
  }

  await insertLog(event);
  broadcastReporterEvent(event.runId, event);

  const data: ApiResponse<typeof event> = {
    message: "Reporter event inserted successfully",
    success: true,
    data: event,
  };

  return c.json(data, 200);
};
