import type { Page } from "playwright-core";
import udmSelector from "../../selectors/udm-selector";
import { automationLog } from "../../util/runtimeLogger";
import { clickButtonWithRetry, waitForButtonEnabled } from "./buttonAction";

export const toggleApprove = async (tab: Page) => {
  const timeout = 30000;
  const saveSel = udmSelector.btnSave;
  const approveSel = udmSelector.btnApprove;
  const reviewSel = udmSelector.btnSubmitForReview;
  const unlockSel = udmSelector.btnUnlock;

  const clicked = await clickButtonWithRetry({
    page: tab,
    selector: approveSel,
    actionName: "toggleApprove",
    timeout,
  });

  if (!clicked) {
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
    await waitForButtonEnabled(tab, unlockSel, timeout);

    automationLog.info("udm.approve.success", {
      expectedButton: "unlock",
    });
    return true;
  } catch (err) {
    automationLog.warn("udm.approve.postcheck_failed", {
      timeout,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
};
