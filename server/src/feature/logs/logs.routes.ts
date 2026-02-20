import { Hono } from "hono";
import { getLogs, insertLog } from "./logs.repo";
import { parsePostBody } from "./logs.parser";
import { broadcastLog } from "./logs.ws";
import type { ApiResponse } from "shared";

export const logsRoutes = new Hono()
  .get("/runs/:runId/logs", async (c) => {
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
      message: "Logs retrieved successfully",
      success: true,
      data: result,
    };

    return c.json(data, 200);
  })
  .post("/runs/:runId/logs", async (c) => {
    const runId = c.req.param("runId");
    const body = await c.req.json().catch(() => null);

    const event = parsePostBody(runId, body);
    if (!event) {
      return c.json(
        {
          message: "Invalid log payload",
          success: false,
          data: null,
        } satisfies ApiResponse<null>,
        400,
      );
    }

    await insertLog(event);
    broadcastLog(event.runId, event);

    const data: ApiResponse<typeof event> = {
      message: "Log inserted successfully",
      success: true,
      data: event,
    };

    return c.json(data, 200);
  });
