import type { Page } from "playwright-core";
import udmSelector from "../../selectors/udm-selector";
import { waitForSpinnerToSettle } from "./waitForUiReady";

function normalizeLanguageName(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function languageCandidates(value: string) {
  const simplified = value.replace(/\s*\(.*\)/, "").trim();
  return Array.from(
    new Set([normalizeLanguageName(value), normalizeLanguageName(simplified)]),
  );
}

export const selectLanguage = async (tab: Page, lng: string) => {
  if (!lng) {
    throw new Error("No language specified");
  }

  const timeout = 30000;
  const candidates = languageCandidates(lng);

  await tab.bringToFront();

  // ✅ ensure app is hydrated
  await tab.waitForSelector("app-root", { timeout });

  const toggle = tab.locator(udmSelector.lng_sel).first();
  const list = tab.locator(udmSelector.lng_list_sel).first();
  const simplified = lng.replace(/\s*\(.*\)/, "").trim();
  let selected = false;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await toggle.waitFor({ state: "visible", timeout });
    await toggle.click();
    await list.waitFor({ state: "visible", timeout });

    const option = list.locator(`li:has-text("${lng}")`).first();
    if (await option.isVisible().catch(() => false)) {
      await option.click();
      selected = true;
      break;
    }

    const fallback = list.locator(`li:has-text("${simplified}")`).first();
    if (await fallback.isVisible().catch(() => false)) {
      await fallback.click();
      selected = true;
      break;
    }

    await toggle.click().catch(() => {});
    await waitForSpinnerToSettle(tab, 2000);
  }

  if (!selected) {
    throw new Error(`selectLanguage: option not found for "${lng}"`);
  }

  // best-effort overlay wait
  await tab
    .waitForSelector(".p-select-overlay", { state: "detached", timeout })
    .catch(() => {});

  // ensure selected language is reflected in the control before proceeding
  await tab.waitForFunction(
    ({ selector, expected }) => {
      const root = document.querySelector(selector);
      if (!root) return false;

      const labelEl = root.querySelector(".selected-language, .p-select-label");
      const trigger = root.querySelector(".p-select-label");
      const labelText = (labelEl?.textContent ?? "").trim().toLowerCase();
      const ariaLabel =
        (trigger?.getAttribute("aria-label") ?? "").trim().toLowerCase();

      return expected.some(
        (value) =>
          labelText.includes(value) ||
          value.includes(labelText) ||
          ariaLabel.includes(value) ||
          value.includes(ariaLabel),
      );
    },
    { selector: udmSelector.lng_sel, expected: candidates },
    { timeout },
  );

  // best-effort wait for spinner to settle after language switch
  await waitForSpinnerToSettle(tab, 5000);
};
