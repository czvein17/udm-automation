import type { Page } from "playwright-core";

import type { Config } from "@shared/schema/config.schema";
import type { Task } from "@shared/schema/task.schema";

import { getElementStatus } from "../../../actions/udm-actions/checkElementStatus";
import { checkFieldName } from "../../../actions/udm-actions/checkFieldName";
import { searchElementInGrid } from "../../../actions/udm-actions/searchElementInGrid";
import { selectLanguage } from "../../../actions/udm-actions/selectLanguage";
import {
  waitForElementPropertiesReady,
  waitForSpinnerToSettle,
} from "../../../actions/udm-actions/waitForUiReady";
import { automationLog } from "../../../util/runtimeLogger";
import { editApplicabilities } from "../edit-applicabilities";
import { editAttributes } from "../edit-attibutes";
import { reApprove } from "../re-approve";
import type { AutomationReporter, RunWithLanguageStepLock } from "./taskRuntime";
import { toErrorMessage } from "./taskRuntime";

const ELEMENT_READY_TIMEOUT = 10000;

function isEnglishTranslation(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "english" || normalized === "english (default)";
}

export async function runElementReadinessAndValidation(args: {
  page: Page;
  task: Task;
  reporter: AutomationReporter;
}) {
  const { page, task, reporter } = args;

  await waitForElementPropertiesReady(page, ELEMENT_READY_TIMEOUT);

  const status = await getElementStatus(page);
  await reporter.emit({
    type: "validate",
    details: "Element status checked",
    payload: { status },
  });

  try {
    const { match, found } = await checkFieldName(page, task.fieldName);
    if (!match) {
      await reporter.emit({
        type: "error",
        details: "Field name mismatch",
        payload: {
          expected: task.fieldName,
          found: found ?? "Unknown",
        },
      });

      automationLog.error("task.field_name_mismatch", {
        runId: task.runId,
        taskId: task.id,
        expected: task.fieldName,
        found: found ?? "Unknown",
      });

      return false;
    }

    await reporter.emit({
      type: "validate",
      details: "Field name validated",
      payload: { fieldName: task.fieldName },
    });

    return true;
  } catch (error) {
    await reporter.emit({
      type: "error",
      details: "Field name validation failed",
      payload: { message: toErrorMessage(error) },
    });

    automationLog.error("task.field_name_check_error", {
      runId: task.runId,
      taskId: task.id,
      error: toErrorMessage(error),
    });
    return false;
  }
}

export async function runTaskLanguageStep(args: {
  page: Page;
  translation: string;
  reporter: AutomationReporter;
  runWithLanguageStepLock: RunWithLanguageStepLock;
}) {
  const { page, translation, reporter, runWithLanguageStepLock } = args;

  if (isEnglishTranslation(translation)) {
    return;
  }

  try {
    await runWithLanguageStepLock(async () => {
      await page.bringToFront();
      await waitForElementPropertiesReady(page, ELEMENT_READY_TIMEOUT);

      try {
        await selectLanguage(page, translation);
        await reporter.emit({
          type: "click",
          details: "Language selected",
          payload: { translation },
        });
      } catch (error) {
        await reporter.emit({
          type: "error",
          details: "Language selection failed",
          payload: {
            message: toErrorMessage(error),
            translation,
          },
        });

        automationLog.error("task.language_selection_failed", {
          error: toErrorMessage(error),
          translation,
        });
      }

      await waitForSpinnerToSettle(page, 3000);
    });
  } catch (error) {
    await reporter.emit({
      type: "error",
      details: "Language block failed",
      payload: {
        message: toErrorMessage(error),
      },
    });

    automationLog.error("task.language_block_error", {
      error: toErrorMessage(error),
    });
  }
}

export async function runAutomationAction(args: {
  page: Page;
  task: Task;
  automationType: string;
  config: Config;
  reporter: AutomationReporter;
}) {
  const { page, task, automationType, config, reporter } = args;

  switch (automationType) {
    case "udm:open_elem":
    case "udm:open_open_elem":
      await reporter.emit({
        type: "navigate",
        details: "Open element action selected",
      });
      break;

    case "udm:re-approve":
      await page.bringToFront();
      await reporter.emit({
        type: "edited",
        details: "Re-approve action started",
      });
      await reApprove(page, reporter);
      break;

    case "udm:edit_attributes":
      await reporter.emit({
        type: "edited",
        details: "Edit attributes action started",
      });
      await editAttributes(page, task, reporter);
      break;

    case "udm:edit_applicabilities":
      await reporter.emit({
        type: "edited",
        details: "Edit applicabilities action started",
      });
      await editApplicabilities(page, task, reporter);
      break;

    default:
      await reporter.emit({
        type: "error",
        details: "Automation type has no mapped action",
        payload: { automationType: config.automationType },
      });
      automationLog.warn("task.automation_type_unmapped", {
        automationType: config.automationType,
        taskId: task.id,
      });
      break;
  }
}

export async function runCopyElementsGridSearch(args: {
  page: Page;
  task: Task;
  url: string;
  reporter: AutomationReporter;
}) {
  const { page, task, url, reporter } = args;

  const searchResult = await searchElementInGrid({
    page,
    task,
    url,
    reporter,
  });

  await reporter.emit({
    type: "success",
    details: "Copy elements search completed",
    payload: {
      cycleType: searchResult.cycleType,
      searchTerm: searchResult.searchTerm,
      gridSelector: searchResult.gridSelector,
    },
  });
}
