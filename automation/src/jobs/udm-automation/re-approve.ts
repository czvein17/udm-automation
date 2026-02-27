import type { Page } from "playwright-core";
import { getElementStatus } from "../../actions/udm-actions/checkElementStatus";
import { ensureUnlocked } from "../../actions/udm-actions/ensureUnlocked";
import { toggleApprove } from "../../actions/udm-actions/toggleApprove";
import { waitForElementPropertiesReady } from "../../actions/udm-actions/waitForUiReady";
import type { createAutomationReporter } from "../../reporter/automationReporter";
import { automationLog } from "../../util/runtimeLogger";

type AutomationReporter = ReturnType<typeof createAutomationReporter>;

export const reApprove = async (tab: Page, reporter?: AutomationReporter) => {
  // ensure this page has focus before interacting (concurrent pages may steal focus)
  await tab.bringToFront();
  await waitForElementPropertiesReady(tab, 10000);
  await reporter?.emit({
    type: "click",
    details: "Re-approve: bring tab to front",
  });

  const unlockStatus = await ensureUnlocked(tab);
  await reporter?.emit({
    type: "validate",
    details: "Re-approve: unlock status",
    payload: { unlockStatus },
  });
  automationLog.info("udm.reapprove.unlock_status", {
    unlockStatus: unlockStatus ?? "unknown",
  });

  // make sure the tab is focused again before keyboard/click actions
  await tab.bringToFront();

  const approved = await toggleApprove(tab);
  await reporter?.emit({
    type: "click",
    details: "Re-approve: toggle approve",
    payload: { approved: approved === true },
  });
  automationLog.info("udm.reapprove.approve_result", {
    approved: approved === true,
  });

  const statusAfterToggle = await getElementStatus(tab);
  await reporter?.emit({
    type: statusAfterToggle === "approved" ? "success" : "error",
    details: "Re-approve: status after toggle",
    payload: { statusAfterToggle },
  });
  automationLog.info("udm.reapprove.status_after_toggle", {
    statusAfterToggle,
  });

  if (!approved || statusAfterToggle !== "approved") {
    throw new Error(
      `Re-approve did not reach approved state (status: ${statusAfterToggle})`,
    );
  }
};
