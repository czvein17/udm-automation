import type { BrowserContext } from "playwright-core";

import type { Config } from "@shared/schema/config.schema";
import type { Task } from "@shared/schema/task.schema";

import { getTasksByRunId } from "../../services/automationApi";
import { buildCycleUrl, buildRecordUrl } from "../../util/buildUrl";
import { automationLog } from "../../util/runtimeLogger";
import {
  runAutomationAction,
  runCopyElementsGridSearch,
  runElementReadinessAndValidation,
  runTaskLanguageStep,
} from "./utils/taskSteps";
import {
  BATCH_SIZE,
  COPY_ELEMENTS_AUTOMATION_TYPE,
  createLanguageStepLock,
  createTaskReporter,
  normalizeAutomationType,
  toErrorMessage,
  type RunWithLanguageStepLock,
} from "./utils/taskRuntime";

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

  const automationType = normalizeAutomationType(config.automationType);
  const isCopyElementsSearch = automationType === COPY_ELEMENTS_AUTOMATION_TYPE;
  const baseSurveyUrl = `${config.baseUrl!}/${config.surveyline}`;

  const url = isCopyElementsSearch
    ? buildCycleUrl(baseSurveyUrl, task.tableName)
    : buildRecordUrl(baseSurveyUrl, task.tableName, task.elementId);

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

    if (isCopyElementsSearch) {
      await runCopyElementsGridSearch({
        page,
        task,
        url,
        reporter,
      });

      return;
    }

    const isFieldNameValid = await runElementReadinessAndValidation({
      page,
      task,
      reporter,
    });

    if (!isFieldNameValid) {
      return;
    }

    await runTaskLanguageStep({
      page,
      translation: String(config.translation ?? ""),
      reporter,
      runWithLanguageStepLock,
    });

    await runAutomationAction({
      page,
      task,
      automationType,
      config,
      reporter,
    });

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
