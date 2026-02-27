import type { Config } from "@shared/schema/config.schema";
import type { Task } from "@shared/schema/task.schema";

import { createAutomationReporter } from "../../../reporter/automationReporter";

export const BATCH_SIZE = 3;
export const COPY_ELEMENTS_AUTOMATION_TYPE =
  "udm:copy_elements_to_another_cycle";

export type AutomationReporter = ReturnType<typeof createAutomationReporter>;
export type RunWithLanguageStepLock = <T>(action: () => Promise<T>) => Promise<T>;

export function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function normalizeAutomationType(value: Config["automationType"] | string) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function createLanguageStepLock(): RunWithLanguageStepLock {
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

export function createTaskReporter(args: {
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
