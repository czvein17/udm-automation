import { chromium, type Browser, type BrowserContext } from "playwright-core";
import fs from "node:fs";
import { envBool, envList } from "../util/env.util";
import {
  normalizeChannel,
  normalizedString,
  resolveStorageStatePath,
} from "../util/normalize.util";

/**
 * Launch a Playwright Chromium browser with sensible defaults and env overrides.
 */
export async function launchBrowser(): Promise<{
  browser: Browser;
  context: BrowserContext;
  storageStatePath?: string;
}> {
  const headless = envBool("BROWSER_HEADLESS", false);

  const engine = normalizedString(process.env.BROWSER_ENGINE) || "chromium";
  const channel = normalizeChannel(process.env.BROWSER_CHANNEL);
  const executablePath = normalizedString(process.env.BROWSER_EXECUTABLE_PATH);

  const args = [
    "--no-first-run",
    "--no-default-browser-check",
    "--start-maximized",
    ...envList("BROWSER_ARGS"),
  ].filter(Boolean);

  const storageStatePath = resolveStorageStatePath(
    process.env.BROWSER_STORAGE_STATE,
  );
  const storageState =
    storageStatePath && fs.existsSync(storageStatePath)
      ? storageStatePath
      : undefined;

  const LaunchOptions: Parameters<typeof chromium.launch>[0] = {
    headless: headless,
    args: args,
  };

  if (engine === "chromium") {
    if (channel) {
      LaunchOptions.channel = channel;
    } else if (executablePath) {
      LaunchOptions.executablePath = executablePath;
    }
  }

  try {
    const browser = await chromium.launch(LaunchOptions);

    const context = await browser.newContext({
      viewport: null,
      storageState,
    });

    return { browser, context, storageStatePath };
  } catch (err) {
    throw new Error(`Failed to launch browser: ${(err as Error).message}`);
  }
}
