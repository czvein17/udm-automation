import * as YTService from "server/dist/feature/youtube/youtube.service";
import * as TaskService from "server/dist/feature/task/task.service";

import { launchBrowser } from "../../shared/browser";
import YT_SEL from "../../selectors/youtube-selector";

export async function runMultipleYtTabs(runId: string) {
  console.log("Running Open Multiple YouTube Tabs job with runId:", runId);

  const taskList = await YTService.getTasksByRunId(runId);

  if (taskList.length === 0) {
    console.log("No tasks found for runId:", runId);
    return;
  }

  const { browser, context, storageStatePath } = await launchBrowser();

  for (const task of taskList) {
    console.log(task);

    const page = await context.newPage();
    try {
      await TaskService.createTaskLogs({
        taskId: task.id,
        logs: [{ status: "loading", action: "navigate to youtube" }],
      });

      await page.goto("https://youtube.com", {
        waitUntil: "domcontentloaded",
      });

      await TaskService.createTaskLogs({
        taskId: task.id,
        logs: [{ status: "success", action: "navigated to youtube" }],
      });

      await TaskService.createTaskLogs({
        taskId: task.id,
        logs: [{ status: "loading", action: "fill search" }],
      });

      await page.fill(YT_SEL.SEARCH_BAR, task.fieldName);

      await TaskService.createTaskLogs({
        taskId: task.id,
        logs: [{ status: "success", action: "filled search" }],
      });

      await TaskService.createTaskLogs({
        taskId: task.id,
        logs: [{ status: "loading", action: "press enter" }],
      });

      await page.press(YT_SEL.SEARCH_BAR, "Enter");

      await TaskService.createTaskLogs({
        taskId: task.id,
        logs: [{ status: "success", action: "search submitted" }],
      });
    } catch (err: any) {
      console.error("Task step error", err);
      await TaskService.createTaskLogs({
        taskId: task.id,
        logs: [{ status: "failed", action: `error: ${err?.message ?? err}` }],
      });
    }
  }
}
