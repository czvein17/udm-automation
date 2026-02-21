import type { Page } from "playwright-core";
import { getElementStatus } from "../../actions/udm-actions/checkElementStatus";
import { ensureUnlocked } from "../../actions/udm-actions/ensureUnlocked";
import { toggleApprove } from "../../actions/udm-actions/toggleApprove";
import type { RowReporter } from "../../shared/reporter";

export const reApprove = async (tab: Page, row: RowReporter) => {
  await tab.waitForTimeout(1000);

  // ensure this page has focus before interacting (concurrent pages may steal focus)
  await row.step("Re-approve: focus tab", {
    action: "bring to front",
  });

  await tab.bringToFront();

  await row.step("Re-approve: unlock check", {
    action: "ensure unlocked",
  });

  const unlockStatus = await ensureUnlocked(tab);

  await row.step("Re-approve: unlock status", {
    status: unlockStatus ?? "unknown",
  });

  await row.step("Re-approve: wait", { delayMs: 500 });
  await tab.waitForTimeout(500);

  // make sure the tab is focused again before keyboard/click actions
  await row.step("Re-approve: refocus tab", {
    action: "bring to front",
  });
  await tab.bringToFront();

  await row.step("Re-approve: click approve", {
    action: "toggle approve",
  });

  const approved = await toggleApprove(tab);

  await row.step("Re-approve: approve result", {
    success: approved === true ? "yes" : "no",
  });

  const statusAfterToggle = await getElementStatus(tab);

  await row.step("Re-approve: status after toggle", {
    status: statusAfterToggle,
  });

  if (!approved || statusAfterToggle !== "approved") {
    throw new Error(
      `Re-approve did not reach approved state (status: ${statusAfterToggle})`,
    );
  }
};
