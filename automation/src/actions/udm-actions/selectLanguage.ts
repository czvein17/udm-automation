import type { Page } from "playwright-core";
import udmSelector from "../../selectors/udm-selector";

export const selectLanguage = async (tab: Page, lng: string) => {
  if (!lng) {
    throw new Error("No language specified");
  }

  console.log("lng");

  const timeout = 30000;

  // ✅ ensure app is hydrated
  await tab.waitForSelector("app-root", { timeout });

  const toggle = tab.locator(udmSelector.lng_sel).first();
  await toggle.waitFor({ state: "visible", timeout });
  await toggle.click();

  const list = tab.locator(udmSelector.lng_list_sel).first();
  await list.waitFor({ state: "visible", timeout });

  const option = list.locator(`li:has-text("${lng}")`).first();
  if (await option.isVisible().catch(() => false)) {
    await option.click();
  } else {
    const simplified = lng.replace(/\s*\(.*\)/, "").trim();
    const fallback = list.locator(`li:has-text("${simplified}")`).first();

    if (await fallback.isVisible().catch(() => false)) {
      await fallback.click();
    } else {
      await tab.keyboard.press("Escape").catch(() => {});
      throw new Error(`selectLanguage: option not found for "${lng}"`);
    }
  }

  // best-effort overlay wait
  await tab
    .waitForSelector(".p-select-overlay", { state: "detached", timeout })
    .catch(() => {});
};
