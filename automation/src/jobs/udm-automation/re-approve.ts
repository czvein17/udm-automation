import type { Page } from "playwright-core";
import { getElementStatus } from "../../actions/udm-actions/checkElementStatus";
import { ensureUnlocked } from "../../actions/udm-actions/ensureUnlocked";
import { toggleApprove } from "../../actions/udm-actions/toggleApprove";

export const reApprove = async (tab: Page) => {
  await tab.waitForTimeout(1000);

  // ensure this page has focus before interacting (concurrent pages may steal focus)
  await tab.bringToFront();

  const unlockStatus = await ensureUnlocked(tab);
  console.log("Re-approve unlock status", unlockStatus ?? "unknown");
  await tab.waitForTimeout(500);

  // make sure the tab is focused again before keyboard/click actions
  await tab.bringToFront();

  const approved = await toggleApprove(tab);
  console.log("Re-approve result", approved === true ? "yes" : "no");

  const statusAfterToggle = await getElementStatus(tab);
  console.log("Re-approve status after toggle", statusAfterToggle);

  if (!approved || statusAfterToggle !== "approved") {
    throw new Error(
      `Re-approve did not reach approved state (status: ${statusAfterToggle})`,
    );
  }
};
