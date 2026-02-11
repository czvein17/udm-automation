import { getRun } from "@server/stores/run.store";
import type { Context } from "hono";

export async function getRunById(c: Context) {
  const runId = c.req.param("runId");
  const run = getRun(runId);

  if (!run) return c.json({ error: "Not found" }, 404);
  return c.json(run, 200);
}
