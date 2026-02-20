import type { Page } from "playwright-core";
import { ensureUnlocked } from "../../actions/udm-actions/ensureUnlocked";
import udmSelector from "../../selectors/udm-selector";
import type { Task } from "@server/db/schema";
import { toggleSave } from "../../actions/udm-actions/toggleSaveBtn";
import type { RowReporter } from "../../shared/reporter";

export const editAttributes = async (
  page: Page,
  task: Task,
  row: RowReporter,
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

  await row.step("Edit display name", { value: displayName });

  await page.fill(elemNameSel, displayName!);

  await toggleSave(page);
};
