import * as YTService from "server/dist/feature/youtube/youtube.service";
import * as TaskService from "server/dist/feature/task/task.service";

import { launchBrowser } from "../../shared/browser";
import YT_SEL from "../../selectors/youtube-selector";

export async function runMultipleYtTabs(runId: string) {
  console.log("[JOB open-youtube] start", { runId });

  const taskList = await YTService.getTasksByRunId(runId);

  if (taskList.length === 0) {
    console.log("No tasks found for runId:", runId);
    return;
  }

  const { browser, context, storageStatePath } = await launchBrowser();

  const BATCH_SIZE = 3;
  for (let i = 0; i < taskList.length; i += BATCH_SIZE) {
    const chunk = taskList.slice(i, i + BATCH_SIZE);

    // run up to BATCH_SIZE pages in parallel, await the whole batch
    await Promise.all(
      chunk.map(async (task) => {
        const page = await context.newPage();
        try {
          // bring the new tab to front so it renders before/while we interact
          await page.bringToFront();

          await TaskService.createTaskLogs({
            taskId: task.id,
            logs: [{ status: "loading", action: "navigate to youtube" }],
          });

          await page.goto("https://youtube.com", {
            waitUntil: "domcontentloaded",
          });

          // ensure the tab is visible and give the renderer a short moment
          await page.bringToFront();
          await page.waitForTimeout(300);

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
            logs: [
              { status: "failed", action: `error: ${err?.message ?? err}` },
            ],
          });
        }
      }),
    );
  }
}
