import * as TaskService from "server/dist/feature/task/task.service";

export function toTitleCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function toUserErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error);

  if (/failed query:/i.test(message)) {
    return "Task log storage failed while processing this row.";
  }

  if (/sqlite_busy|database is locked/i.test(message)) {
    return "Database is busy. Please try again.";
  }

  return message;
}

function isBusyError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error);

  return /sqlite_busy|database is locked/i.test(message);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function createTaskLogsWithRetry(payload: {
  taskId: string;
  logs: {
    status: "success" | "loading" | "failed" | "error";
    action: string;
  }[];
}) {
  const delaysMs = [30, 80, 160, 300];

  for (let attempt = 0; attempt <= delaysMs.length; attempt += 1) {
    try {
      await TaskService.createTaskLogs(payload);
      return;
    } catch (error) {
      if (!isBusyError(error) || attempt === delaysMs.length) {
        throw error;
      }

      await sleep(delaysMs[attempt]!);
    }
  }
}

export async function appendTaskLog(
  taskId: string,
  logs: {
    status: "success" | "loading" | "failed" | "error";
    action: string;
  }[],
) {
  try {
    await createTaskLogsWithRetry({ taskId, logs });
  } catch (error) {
    console.warn("Task log write failed", {
      taskId,
      err: toUserErrorMessage(error),
    });
  }
}
