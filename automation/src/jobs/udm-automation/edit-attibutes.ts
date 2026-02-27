import type { Page } from "playwright-core";
import type { Task } from "@shared/schema/task.schema";
import { ensureUnlocked } from "../../actions/udm-actions/ensureUnlocked";
import udmSelector from "../../selectors/udm-selector";
import { toggleSave } from "../../actions/udm-actions/toggleSaveBtn";
import { waitForElementPropertiesReady } from "../../actions/udm-actions/waitForUiReady";
import type { createAutomationReporter } from "../../reporter/automationReporter";
import { automationLog } from "../../util/runtimeLogger";

type AutomationReporter = ReturnType<typeof createAutomationReporter>;

export const editAttributes = async (
  page: Page,
  task: Task,
  reporter?: AutomationReporter,
) => {
  automationLog.info("udm.edit_attributes.unlock_start", {
    taskId: task.id,
  });
  await reporter?.emit({
    type: "validate",
    details: "Edit attributes: ensure unlocked",
  });

  await waitForElementPropertiesReady(page, 10000);

  const unlockStatus = await ensureUnlocked(page);
  await reporter?.emit({
    type: "validate",
    details: "Edit attributes: unlock status",
    payload: { unlockStatus },
  });

  automationLog.info("udm.edit_attributes.unlock_status", {
    taskId: task.id,
    unlockStatus,
  });

  const elemNameSel = udmSelector.attrElemNameInput;
  const displayName = task.displayName;

  await page.locator(elemNameSel).first().waitFor({ state: "visible", timeout: 10000 });

  await page.fill(elemNameSel, displayName!);
  await reporter?.emit({
    type: "fill",
    details: "Edit attributes: filled display name",
    payload: { displayName },
  });

  const saveResult = await toggleSave(page);
  await reporter?.emit({
    type: saveResult ? "success" : "error",
    details: "Edit attributes: save result",
    payload: { saveResult: saveResult === true },
  });
  automationLog.info("udm.edit_attributes.save_result", {
    taskId: task.id,
    saveResult: saveResult === true,
  });
};
