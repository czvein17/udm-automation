import type { Context, Next } from "hono";

import { respondBadRequest } from "@server/util/apiResponse.util";

export function requireParam(name: string, label = name) {
  return async (c: Context, next: Next) => {
    const value = c.req.param(name)?.trim();
    if (!value) {
      return respondBadRequest(c, `${label} is required`);
    }

    await next();
  };
}

export function requireQuery(name: string, label = name) {
  return async (c: Context, next: Next) => {
    const value = c.req.query(name)?.trim();
    if (!value) {
      return respondBadRequest(c, `${label} is required`);
    }

    await next();
  };
}

export function requireJsonBody(message = "request body is required") {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      if (body == null) {
        return respondBadRequest(c, message);
      }
    } catch {
      return respondBadRequest(c, "invalid JSON body");
    }

    await next();
  };
}
