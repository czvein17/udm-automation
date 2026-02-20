import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import type { ApiResponse } from "shared/dist";
import path from "node:path";
import { appRouter } from "./app/router";
import { errorMiddleware } from "./middleware/errorHandler";

process.title = "bhvr-api-dev";
console.log(`🚀 ${process.title} running (PID: ${process.pid})`);

const BUN_ENV = process.env.NODE_ENV || "development";
const clientDist = path.resolve(process.cwd(), "../client/dist");

console.log(process.env.DB_FILE_NAME);

const app = new Hono();

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

app.use("/*", serveStatic({ root: clientDist }));
app.get("*", serveStatic({ path: path.join(clientDist, "index.html") }));

export default app;
export type ApiRoute = typeof api;
