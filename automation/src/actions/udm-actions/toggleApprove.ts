import type { Page } from "playwright-core";
import udmSelector from "../../selectors/udm-selector";

export const toggleApprove = async (tab: Page) => {
  const timeout = 30000;
  const saveSel = udmSelector.btnSave;
  const approveSel = udmSelector.btnApprove;
  const reviewSel = udmSelector.btnSubmitForReview;
  const unlockSel = udmSelector.btnUnlock;
  const spinnerSel = udmSelector.spinner || ".ngx-spinner-overlay";

  const approveBtn = tab.locator(approveSel).first();

  if ((await approveBtn.count()) === 0) {
    console.log("toggleApprove: approve button not found.");
    return false;
  }

  // wait for any global spinner to disappear
  await tab
    .waitForSelector(spinnerSel, { state: "detached", timeout })
    .catch(() => {});

  // try clicking approve with small retries to avoid transient overlay/spinner issues
  let clicked = false;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await approveBtn.waitFor({
        state: "visible",
        timeout: Math.min(5000, timeout),
      });
      if (!(await approveBtn.isEnabled())) {
        console.log("toggleApprove: approve button is disabled.");
        return false;
      }
      await approveBtn.click({ timeout: Math.min(10000, timeout) });
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
    console.warn(`toggleApprove: failed to click approve button: ${errMsg}`);
    return false;
  }

  // after clicking, wait for save/approve/review buttons to disappear
  try {
    await Promise.all([
      tab
        .waitForSelector(saveSel, { state: "detached", timeout })
        .catch(() => {}),
      tab
        .waitForSelector(approveSel, { state: "detached", timeout })
        .catch(() => {}),
      tab
        .waitForSelector(reviewSel, { state: "detached", timeout })
        .catch(() => {}),
    ]);

    // wait for unlock button to appear and be enabled
    await tab.waitForFunction(
      (selector) => {
        const el = document.querySelector(selector);
        if (!(el instanceof HTMLButtonElement)) return false;
        return !el.disabled && !el.hasAttribute("disabled");
      },
      unlockSel,
      { timeout },
    );

    console.log("toggleApprove: approve succeeded and unlock visible.");
    return true;
  } catch (err) {
    console.warn(
      "toggleApprove: expected UI state changes did not occur after approve.",
      err,
    );
    return false;
  }
};
