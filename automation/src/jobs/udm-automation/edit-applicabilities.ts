import type { Task } from "@server/db/schema";
import type { Page } from "playwright-core";
import type { RowReporter } from "../../shared/logger.util";
import udmSelector from "../../selectors/udm-selector";

export const editApplicabilities = async (
  tab: Page,
  task: Task,
  row: RowReporter,
) => {
  const waitTimeout = 30000;

  const tabBtn = tab.locator(udmSelector.applicabilitiesTab).first();
  await tabBtn.waitFor({ state: "visible", timeout: waitTimeout });

  // get panel id from aria-controls if available, click the tab, then wait for panel
  const panelId = (await tabBtn.getAttribute("aria-controls")) || null;
  await tabBtn.click();

  row.step("Click: Applicabilities tab", {
    action: "click",
  });

  if (panelId) {
    await tab.waitForSelector(`#${panelId}`, { timeout: waitTimeout });
  } else {
    // fallback: wait for the tab's aria-selected to become true
    await tab.waitForFunction(
      (sel) =>
        document.querySelector(sel)?.getAttribute("aria-selected") === "true",
      udmSelector.applicabilitiesTab,
      { timeout: waitTimeout },
    );
  }
};
