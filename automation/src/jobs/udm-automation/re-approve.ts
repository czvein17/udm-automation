import type { Page } from "playwright-core";
import { ensureUnlocked } from "../../actions/udm-actions/ensureUnlocked";
import { toggleApprove } from "../../actions/udm-actions/toggleApprove";

export const reApprove = async (tab: Page) => {
  // ensure this page has focus before interacting (concurrent pages may steal focus)
  await tab.bringToFront();

  await ensureUnlocked(tab);

  await tab.waitForTimeout(500);

  // make sure the tab is focused again before keyboard/click actions
  await tab.bringToFront();

  await toggleApprove(tab);
};
