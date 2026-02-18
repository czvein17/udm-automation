import fs from "node:fs";
import { chromium, type Browser, type BrowserContext } from "playwright-core";
import { resolveStatePath } from "./path";

export async function createBrowserWithState(): Promise<{
  browser: Browser;
  context: BrowserContext;
  statePath: string;
}> {
  const statePath = resolveStatePath("auth.json");

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
