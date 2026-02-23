import type { Task } from "@shared/schema/task.schema";
import type { Page } from "playwright-core";
import udmSelector from "../../selectors/udm-selector";
import type { createAutomationReporter } from "../../reporter/automationReporter";
import { automationLog } from "../../util/runtimeLogger";

type AutomationReporter = ReturnType<typeof createAutomationReporter>;

export const editApplicabilities = async (
  tab: Page,
  task: Task,
  reporter?: AutomationReporter,
) => {
  const waitTimeout = 30000;

  const tabBtn = tab.locator(udmSelector.applicabilitiesTab).first();
  await tabBtn.waitFor({ state: "visible", timeout: waitTimeout });

  // get panel id from aria-controls if available, click the tab, then wait for panel
  const panelId = (await tabBtn.getAttribute("aria-controls")) || null;
  await tabBtn.click();
  await reporter?.emit({
    type: "click",
    details: "Edit applicabilities: click tab",
    payload: { panelId: panelId ?? undefined },
  });
  automationLog.info("udm.edit_applicabilities.tab_clicked", {
    taskId: task.id,
    panelId: panelId ?? "unknown",
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
