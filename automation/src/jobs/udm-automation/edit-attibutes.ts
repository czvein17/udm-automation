import type { Page } from "playwright-core";
import { ensureUnlocked } from "../../actions/udm-actions/ensureUnlocked";
import udmSelector from "../../selectors/udm-selector";
import type { Task } from "@server/db/schema";
import { toggleSave } from "../../actions/udm-actions/toggleSaveBtn";
import type { AutomationLogger, LogContext } from "../../shared/logger";

export const editAttributes = async (
  page: Page,
  task: Task,
  logger: AutomationLogger,
  ctx: LogContext,
) => {
  console.log("Attempting to unlcok");

  const delayMs = 3000;

  if (delayMs > 0) {
    console.log(`Waiting ${delayMs}ms for UI to settle...`);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  const unlockStatus = await ensureUnlocked(page);

  console.log(unlockStatus);

  const elemNameSel = udmSelector.attrElemNameInput;

  const displayName = task.displayName;

  await logger.info("edit_display_name", { displayName }, ctx);

  await page.fill(elemNameSel, displayName!);

  await toggleSave(page);
};
