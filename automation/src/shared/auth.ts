import fs from "node:fs";
import path from "node:path";
import { mkdirSync } from "node:fs";
import type { Page, BrowserContext } from "playwright-core";
import udmSelector from "../selectors/udm-selector";

export async function ensureLoggedIn(opts: {
  page: Page;
  context: BrowserContext;
  baseUrl: string;
  statePath: string;
  logger: { info: (...a: any[]) => void; error: (...a: any[]) => void };
}) {
  const { page, context, baseUrl, statePath, logger } = opts;

  const APP_HOST = new URL(baseUrl).host;

  // ✅ Your inside-app marker (keep yours)
  const strong = page.locator(udmSelector.StrongInside).first();

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  // quick check: already logged in?
  const shortTimeout = 30000;
  try {
    await strong.waitFor({ state: "visible", timeout: shortTimeout });
    console.log("🔓 Inside app (authenticated).");
    await context.storageState({ path: statePath });
    return;
  } catch {}

  // ✅ Treat these as SSO/IdP pages
  const SSO_HOSTS = new Set([
    "auth.ehr.com",
    "login.microsoftonline.com",
    "login.microsoft.com",
    "aadcdn.msauth.net",
    "aadcdn.msftauth.net",
  ]);

  const urlNow = page.url();
  let hostNow = "";
  try {
    hostNow = new URL(urlNow).host;
  } catch {
    hostNow = "";
  }

  const isSSOPage =
    hostNow === "" ||
    hostNow.includes("auth.ehr.com") ||
    hostNow.includes("microsoftonline.com") ||
    hostNow.includes("microsoft.com") ||
    SSO_HOSTS.has(hostNow);

  if (isSSOPage) {
    console.log(
      "🔐 SSO detected. Please complete login/MFA in the opened browser.",
    );
    console.log("SSO URL:", urlNow);

    // await page.waitForSelector("#signInName", { timeout: 5000 });
    // await page.fill("#signInName", process.env.UDM_USERNAME ?? "CZVEI8167");
    // // if the continue button navigates, wait for navigation
    // await Promise.all([
    //   page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }),
    //   page.click("#continue"),
    // ]);

    // ✅ Wait until we're back to the app host (no timeout)
    await page.waitForURL(
      (u) => {
        try {
          return new URL(u.toString()).host === APP_HOST;
        } catch {
          return false;
        }
      },
      { timeout: 0 },
    );

    console.log(
      "🔁 Returned to app host. Navigating to baseUrl to ensure correct start page...",
    );
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    // ✅ Now wait for inside marker (normal timeout)
    const waitTimeout = 30000;
    await strong.waitFor({ state: "visible", timeout: waitTimeout });

    console.log("✅ Login completed – inside app.");
    await context.storageState({ path: statePath });
    return;
  }

  // Otherwise: unexpected page
  mkdirSync("artifacts", { recursive: true });
  await page.screenshot({
    path: "artifacts/inside_marker_missing.png",
    fullPage: true,
  });

  throw new Error(
    `Authenticated check failed: not on recognized SSO page, and inside marker not found. Current URL=${urlNow}. Screenshot saved: artifacts/inside_marker_missing.png`,
  );
}
