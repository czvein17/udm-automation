import type { Page } from "playwright-core";
import udmSelector from "../../selectors/udm-selector";

export const toggleSave = async (tab: Page) => {
  const timeout = 30000;
  const saveSel = udmSelector.btnSave;
  const approveSel = udmSelector.btnApprove;
  const spinnerSel = udmSelector.spinner || ".ngx-spinner-overlay";

  const saveBtn = tab.locator(saveSel).first();

  if ((await saveBtn.count()) === 0) {
    console.log("toggleSaveBtn: save button not found.");
    return false;
  }

  // wait for any global spinner to disappear
  await tab
    .waitForSelector(spinnerSel, { state: "detached", timeout })
    .catch(() => {});

  // try clicking save with small retries to avoid transient overlay/spinner issues
  let clicked = false;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await saveBtn.waitFor({
        state: "visible",
        timeout: Math.min(5000, timeout),
      });
      if (!(await saveBtn.isEnabled())) {
        // if not enabled, bail early
        console.log("toggleSaveBtn: save button is disabled.");
        return false;
      }
      await saveBtn.click({ timeout: Math.min(10000, timeout) });
      clicked = true;
      break;
    } catch (err) {
      lastErr = err;
      // wait briefly for spinner to clear then retry
      await tab
        .waitForSelector(spinnerSel, { state: "detached", timeout: 3000 })
        .catch(() => {});
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }

  if (!clicked) {
    const errMsg =
      lastErr instanceof Error ? lastErr.message : String(lastErr ?? "unknown");

    console.warn(`toggleSaveBtn: failed to click save button: ${errMsg}`);
    return false;
  }

  // after clicking, wait for approve button to become enabled (no 'disabled' attribute)
  try {
    await tab.waitForFunction(
      (selector) => {
        const el = document.querySelector(selector);

        // safest: check it's actually a button
        if (!(el instanceof HTMLButtonElement)) return false;

        return !el.disabled && !el.hasAttribute("disabled");
      },
      approveSel,
      { timeout },
    );

    console.log("toggleSaveBtn: approve button enabled — save succeeded.");
    return true;
  } catch {
    console.warn(
      "toggleSaveBtn: approve button did not become enabled within timeout.",
    );
    return false;
  }
};
