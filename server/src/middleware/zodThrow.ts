import type { Context, Next } from "hono";
import type { ZodSchema } from "zod";

export function zodThrow(
  schema: ZodSchema<any>,
  source: "json" | "body" | "query" = "json",
) {
  return async (c: Context, next: Next) => {
    let payload: unknown;
    if (source === "json") payload = await c.req.json();
    else if (source === "body") payload = await c.req.text();
    else payload = c.req.query();

    // parseAsync will throw ZodError on invalid input which bubbles to onError
    await schema.parseAsync(payload);
    await next();
  };
}
