import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser, type BrowserContext } from "playwright-core";
import { resolveStatePath } from "./path";

export async function createBrowserWithState(): Promise<{
  browser: Browser;
  context: BrowserContext;
  statePath: string;
}> {
  const rawStatePath = (process.env.BROWSER_STORAGE_STATE ?? "").trim();
  const statePath = resolveStatePath(rawStatePath || "auth.json");
  fs.mkdirSync(path.dirname(statePath), { recursive: true });

  const browser = await chromium.launch({
    headless: process.env.BROWSER_HEADLESS === "true",
    channel: process.env.BROWSER_CHANNEL || "msedge", // important for playwright-core
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: null,
    storageState: fs.existsSync(statePath) ? statePath : undefined,
  });

  return { browser, context, statePath };
}
