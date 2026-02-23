import type { Page } from "playwright-core";
import udmSelector from "../../selectors/udm-selector";
import { automationLog } from "../../util/runtimeLogger";
import { clickButtonWithRetry, waitForButtonEnabled } from "./buttonAction";

export const toggleSave = async (tab: Page) => {
  const timeout = 30000;
  const saveSel = udmSelector.btnSave;
  const approveSel = udmSelector.btnApprove;

  const clicked = await clickButtonWithRetry({
    page: tab,
    selector: saveSel,
    actionName: "toggleSaveBtn",
    timeout,
  });

  if (!clicked) {
    return false;
  }

  // after clicking, wait for approve button to become enabled (no 'disabled' attribute)
  try {
    await waitForButtonEnabled(tab, approveSel, timeout);

    automationLog.info("udm.save.success", { nextButton: "approve" });
    return true;
  } catch {
    automationLog.warn("udm.save.postcheck_timeout", {
      expectedButton: "approve",
      timeout,
    });
    return false;
  }
};
