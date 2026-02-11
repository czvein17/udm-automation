import type { Page, Locator } from "playwright-core";
import { actionInfo, checkInfo } from "./logger";

export async function nav(page: Page, step: string, url: string) {
  actionInfo(step, "Navigate", `Navigate to ${url}`, { url });
  await page.goto(url, { waitUntil: "domcontentloaded" });
}

export async function click(locator: Locator, step: string, label: string) {
  actionInfo(step, "Click", `Click ${label}`, {});
  await locator.click();
}

export async function expectVisible(
  locator: Locator,
  step: string,
  label: string,
  timeout = 10000,
) {
  checkInfo(step, `Check visible: ${label}`, { timeout });
  await locator.waitFor({ state: "visible", timeout });
}
