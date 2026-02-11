import type { Context } from "hono";
import { startOpenYoutubeRun } from "./youtube.service";

export async function openYoutube(c: Context) {
  const result = await startOpenYoutubeRun();
  return c.json(result, { status: 200 });
}
