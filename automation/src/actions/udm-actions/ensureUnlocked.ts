import type { Page } from "playwright-core";
import udmSelector from "../../selectors/udm-selector";

export const ensureUnlocked = async (tab: Page) => {
  const timeout = 30000;
  // fallback to common dialog containers if selector not set
  const dialogSelector =
    udmSelector.dialogSel || "mat-dialog-container, .mat-mdc-dialog-container";
  const unlockBtn = tab.locator(udmSelector.btnUnlock).first();

  if (!(await unlockBtn.count()) || !(await unlockBtn.isVisible())) {
    console.log("🔓 Element already unlocked (no unlock control present).");
    return "already-unlocked";
  }

  console.log("🔒 Element locked — attempting unlock...");
  await unlockBtn.click();
  await tab.waitForTimeout(500); // wait for potential dialog to appear
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
    console.log(
      "✅ Unlock confirmed (via overlay eval). Waiting for UI to update...",
    );

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

    console.log("UI update wait complete (unlock flow).");
    return "unlocked";
  }
};
