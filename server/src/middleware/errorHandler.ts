import type { Context } from "hono";
import { ZodError } from "zod";
import { formatZodError, formatZodErrorMessage } from "../util/zod.util";

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

  console.error(err);
  return c.json(
    { success: false, error: { name: "Error", message: String(err) } },
    { status: 500 },
  );
}
