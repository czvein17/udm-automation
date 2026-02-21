import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createBunWebSocket, serveStatic } from "hono/bun";
import type { ApiResponse } from "shared/dist";
import path from "node:path";
import { appRouter } from "./app/router";
import { errorMiddleware } from "./middleware/errorHandler";
import {
  connectReporterRoom,
  disconnectReporterRoom,
} from "./feature/logs/logs.ws";
export type { LogEvent, LogLevel } from "./feature/logs/logs.schema";

process.title = "bhvr-api-dev";
console.log(`🚀 ${process.title} running (PID: ${process.pid})`);

const BUN_ENV = process.env.NODE_ENV || "development";
const clientDist = path.resolve(process.cwd(), "../client/dist");

console.log(process.env.DB_FILE_NAME);

const app = new Hono();
const { upgradeWebSocket, websocket } = createBunWebSocket();

app.use(cors());
app.use(logger());

app.onError(errorMiddleware);

const api = app.basePath("/api/v1");

api.route("/", appRouter);
api.get("/hello", async (c) => {
  const data: ApiResponse<null> = {
    message: "Hello BHVR!",
    success: true,
    data: null,
  };

  return c.json(data, { status: 200 });
});

const reporterWebSocketHandler = upgradeWebSocket((c) => {
  const runId = c.req.param("runId");

  return {
    onOpen: async (_event, ws) => {
      await connectReporterRoom(runId, ws);
    },
    onClose: (_event, ws) => {
      disconnectReporterRoom(runId, ws);
    },
  };
});

app.get("/ws/reporter/:runId", reporterWebSocketHandler);

app.use("/*", serveStatic({ root: clientDist }));
app.get("*", serveStatic({ path: path.join(clientDist, "index.html") }));

export type ApiRoute = typeof api;
export default {
  fetch: app.fetch,
  websocket,
};
