import type { Context } from "hono";
import { ZodError } from "zod";
import { formatZodError, formatZodErrorMessage } from "../util/zod.util";
import { serverLog } from "@server/util/runtimeLogger";

export async function errorMiddleware(err: unknown, c: Context) {
  if (err instanceof ZodError) {
    const details = formatZodError(err);
    return c.json(
      {
        success: false,
        error: {
          name: "ValidationError",
          message: formatZodErrorMessage(err),
          details,
        },
      },
      { status: 400 },
    );
  }

  serverLog.error("http.unhandled_error", {
    method: c.req.method,
    path: c.req.path,
    error: err instanceof Error ? err.message : String(err),
  });
  return c.json(
    { success: false, error: { name: "Error", message: String(err) } },
    { status: 500 },
  );
}
