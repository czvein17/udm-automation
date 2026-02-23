import type { Config } from "@shared/schema/config.schema";
import type { Task } from "@shared/schema/task.schema";
import type { BrowserContext, Page } from "playwright-core";

import { getElementStatus } from "../../actions/udm-actions/checkElementStatus";
import { checkFieldName } from "../../actions/udm-actions/checkFieldName";
import { selectLanguage } from "../../actions/udm-actions/selectLanguage";
import {
  waitForElementPropertiesReady,
  waitForSpinnerToSettle,
} from "../../actions/udm-actions/waitForUiReady";
import { createAutomationReporter } from "../../reporter/automationReporter";
import { getTasksByRunId } from "../../services/automationApi";
import { buildRecordUrl } from "../../util/buildUrl";
import { automationLog } from "../../util/runtimeLogger";
import { editApplicabilities } from "./edit-applicabilities";
import { editAttributes } from "./edit-attibutes";
import { reApprove } from "./re-approve";

const BATCH_SIZE = 3;
const ELEMENT_READY_TIMEOUT = 10000;

type AutomationReporter = ReturnType<typeof createAutomationReporter>;
type RunWithLanguageStepLock = <T>(action: () => Promise<T>) => Promise<T>;

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isEnglishTranslation(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "english" || normalized === "english (default)";
}

function createLanguageStepLock(): RunWithLanguageStepLock {
  let queue = Promise.resolve();

  return async <T>(action: () => Promise<T>) => {
    const next = queue.then(action, action);
    queue = next.then(
      () => undefined,
      () => undefined,
    );

    return next;
  };
}

function createTaskReporter(args: {
  runId: string;
  rowIndex: number;
  task: Task;
  url: string;
}): AutomationReporter {
  const { runId, rowIndex, task, url } = args;

  return createAutomationReporter({
    runId,
    taskId: task.id,
    taskMeta: {
      rowIndex,
      fieldName: task.fieldName,
      elementId: task.elementId,
      tableName: task.tableName,
      elementName: task.elementName ?? undefined,
      displayName: task.displayName ?? undefined,
      url,
    },
  });
}

async function validateTaskFieldName(
  page: Page,
  task: Task,
  reporter: AutomationReporter,
) {
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

async function runTaskLanguageStep(args: {
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

async function runAutomationAction(args: {
  page: Page;
  task: Task;
  config: Config;
  reporter: AutomationReporter;
}) {
  const { page, task, config, reporter } = args;

  const automationType = String(config.automationType ?? "")
    .trim()
    .toLowerCase();

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

async function runTask(args: {
  context: BrowserContext;
  config: Config;
  runId: string;
  task: Task;
  rowIndex: number;
  runWithLanguageStepLock: RunWithLanguageStepLock;
}) {
  const { context, config, runId, task, rowIndex, runWithLanguageStepLock } =
    args;
  const page = await context.newPage();

  const url = buildRecordUrl(
    `${config.baseUrl!}/${config.surveyline}`,
    task.tableName,
    task.elementId,
  );

  const reporter = createTaskReporter({
    runId,
    rowIndex,
    task,
    url,
  });

  try {
    await page.bringToFront();

    await reporter.emit({
      type: "navigate",
      details: "Navigate to task URL",
      payload: { url },
    });

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.bringToFront();
    await waitForElementPropertiesReady(page, ELEMENT_READY_TIMEOUT);

    const status = await getElementStatus(page);
    await reporter.emit({
      type: "validate",
      details: "Element status checked",
      payload: { status },
    });

    const isFieldNameValid = await validateTaskFieldName(page, task, reporter);
    if (!isFieldNameValid) {
      return;
    }

    await runTaskLanguageStep({
      page,
      translation: String(config.translation ?? ""),
      reporter,
      runWithLanguageStepLock,
    });

    await runAutomationAction({ page, task, config, reporter });

    await reporter.emit({
      type: "success",
      details: "Task completed",
    });
  } catch (error) {
    await reporter.emit({
      type: "error",
      details: "Task failed",
      payload: { message: toErrorMessage(error) },
    });

    automationLog.error("task.run_failed", {
      runId,
      taskId: task.id,
      error: toErrorMessage(error),
    });
  }
}

export const startAutomation = async (
  config: Config,
  runId: string,
  context: BrowserContext,
) => {
  const runWithLanguageStepLock = createLanguageStepLock();
  const taskList = await getTasksByRunId(runId);

  if (!taskList.length) {
    automationLog.warn("run.tasks_empty", { runId });
    throw new Error(`No tasks found for runId: ${runId}`);
  }

  automationLog.info("run.tasks_loaded", {
    runId,
    count: taskList.length,
  });

  for (let index = 0; index < taskList.length; index += BATCH_SIZE) {
    const chunk = taskList.slice(index, index + BATCH_SIZE);

    await Promise.all(
      chunk.map((task, chunkIndex) =>
        runTask({
          context,
          config,
          runId,
          task,
          rowIndex: index + chunkIndex + 1,
          runWithLanguageStepLock,
        }),
      ),
    );
  }
};
