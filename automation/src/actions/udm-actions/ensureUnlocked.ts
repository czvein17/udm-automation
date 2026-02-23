import type { Page } from "playwright-core";
import udmSelector from "../../selectors/udm-selector";
import { automationLog } from "../../util/runtimeLogger";

export const ensureUnlocked = async (tab: Page) => {
  const timeout = 30000;
  // fallback to common dialog containers if selector not set
  const dialogSelector =
    udmSelector.dialogSel || "mat-dialog-container, .mat-mdc-dialog-container";
  const unlockBtn = tab.locator(udmSelector.btnUnlock).first();

  if (!(await unlockBtn.count()) || !(await unlockBtn.isVisible())) {
    automationLog.info("udm.unlock.already_unlocked");
    return "already-unlocked";
  }

  automationLog.info("udm.unlock.start");
  await unlockBtn.click();
  await tab.waitForSelector(dialogSelector, { state: "visible", timeout });

  // Try to find and click an "Unlock" button inside any overlay using evaluation (robust to different containers)
  const clicked = await tab.evaluate<boolean>(() => {
    const containers = Array.from(
      document.querySelectorAll(
        "cdk-overlay-container, .cdk-overlay-container, mat-dialog-container, .mat-mdc-dialog-container",
      ),
    );

    for (const c of containers) {
      const buttons = Array.from(
        c.querySelectorAll<HTMLButtonElement>("button"),
      );
      for (const b of buttons) {
        const txt = (b.innerText || b.textContent || "").trim().toLowerCase();
        if (txt.includes("unlock")) {
          try {
            b.click();
          } catch {
            // ignore
          }
          return true;
        }
      }
    }

    return false;
  });

  if (clicked) {
    await tab
      .waitForSelector(dialogSelector, { state: "detached", timeout })
      .catch(() => {});
    automationLog.info("udm.unlock.confirmed", {
      source: "overlay-eval",
    });

    // After unlocking the UI should update: unlock control should disappear and save/approve should appear.
    try {
      await tab
        .waitForSelector(udmSelector.btnUnlock, {
          state: "detached",
          timeout,
        })
        .catch(() => {});
    } catch (e) {
      // ignore
    }

    // Wait for either Save or Approve button to become visible as a sign the UI is ready.
    try {
      await Promise.race([
        tab.waitForSelector(udmSelector.btnSave, {
          state: "visible",
          timeout,
        }),

        tab.waitForSelector(udmSelector.btnApprove, {
          state: "visible",
          timeout,
        }),
      ]).catch(() => {});
    } catch (e) {
      // ignore
    }

    automationLog.info("udm.unlock.ui_ready");
    return "unlocked";
  }
};
