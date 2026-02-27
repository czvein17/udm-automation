import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createBunWebSocket, serveStatic } from "hono/bun";
import type { ApiResponse } from "shared";
import path from "node:path";
import { appRouter } from "./app/router";
import { errorMiddleware } from "./middleware/errorHandler";
import { serverLog } from "./util/runtimeLogger";
import {
  onAutomationTerminalSocketClose,
  onAutomationTerminalSocketMessage,
  onAutomationTerminalSocketOpen,
} from "./feature/automationTerminal";

process.title = "bhvr-api-dev";
serverLog.info("server.start", {
  processTitle: process.title,
  pid: process.pid,
});

const BUN_ENV = process.env.NODE_ENV || "development";
const clientDist = path.resolve(process.cwd(), "../client/dist");

serverLog.info("server.config", {
  env: BUN_ENV,
  dbFileName: process.env.DB_FILE_NAME ?? "<unset>",
});

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

app.get(
  "/ws/automation-terminal",
  upgradeWebSocket(() => {
    return {
      onOpen: (_event, ws) => {
        onAutomationTerminalSocketOpen(ws);
      },
      onClose: (_event, ws) => {
        onAutomationTerminalSocketClose(ws);
      },
      onMessage: async (event, ws) => {
        await onAutomationTerminalSocketMessage(ws, event.data);
      },
    };
  }),
);

app.use("/*", serveStatic({ root: clientDist }));
app.get("*", serveStatic({ path: path.join(clientDist, "index.html") }));

export type ApiRoute = typeof api;
export default {
  fetch: app.fetch,
  websocket,
};
