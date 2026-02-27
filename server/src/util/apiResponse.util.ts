import type { Context } from "hono";

import type { ApiResponse } from "shared";

export function respondOk<T>(
  c: Context,
  data: T,
  message: string,
) {
  const body: ApiResponse<T> = {
    message,
    success: true,
    data,
  };

  return c.json(body, { status: 200 });
}

export function respondCreated<T>(c: Context, data: T, message: string) {
  const body: ApiResponse<T> = {
    message,
    success: true,
    data,
  };

  return c.json(body, { status: 201 });
}

export function respondBadRequest(c: Context, message: string) {
  const body: ApiResponse<null> = {
    message,
    success: false,
    data: null,
  };

  return c.json(body, { status: 400 });
}

export function respondNotFound(c: Context, message: string) {
  const body: ApiResponse<null> = {
    message,
    success: false,
    data: null,
  };

  return c.json(body, { status: 404 });
}

export function respondEmptyList<T>(c: Context, message: string) {
  const body: ApiResponse<T[]> = {
    message,
    success: true,
    data: [],
  };

  return c.json(body, { status: 200 });
}
