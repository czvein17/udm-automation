import type { Config } from "@server/db/schema";

import * as YTService from "server/dist/feature/youtube/youtube.service";
import * as TaskService from "server/dist/feature/task/task.service";
import { buildRecordUrl } from "../../util/buildUrl";
import { launchBrowser } from "../../shared/browser";
import { getElementStatus } from "../../actions/udm-actions/checkElementStatus";
import { cliLog } from "../../shared/cli-log";

export const startAutomation = async (
  config: Config,
  runId: string,
  context: any,
) => {
  const taskList = await YTService.getTasksByRunId(runId);

  if (!taskList || taskList.length === 0) {
    throw new Error("No tasks found for runId: " + runId);
  }

  const BATCH_SIZE = 3;
  for (let i = 0; i < taskList.length; i += BATCH_SIZE) {
    const chunk = taskList.slice(i, i + BATCH_SIZE);

    await Promise.all(
      chunk.map(async (task) => {
        const page = await context.newPage();
        try {
          await page.bringToFront();

          await TaskService.createTaskLogs({
            taskId: task.id,
            logs: [{ status: "loading", action: "navigate to record" }],
          });

          const tableName = task.tableName;
          const elementId = task.elementId;

          const url = buildRecordUrl(
            `${config.baseUrl!}/${config.surveyline}`,
            tableName,
            elementId,
          );

          cliLog(runId, "info", "navigate", { url });

          await page.goto(url, { waitUntil: "domcontentloaded" });

          await page.bringToFront();
          await page.waitForTimeout(300);

          const status = await getElementStatus(page);

          cliLog(runId, "debug", "element_status", { taskId: task.id, status });
          if (status === "approved") {
            await TaskService.createTaskLogs({
              taskId: task.id,
              logs: [{ status: "success", action: "Element Approve " }],
            });
          } else {
            await TaskService.createTaskLogs({
              taskId: task.id,
              logs: [{ status: "failed", action: "element not approved" }],
            });
          }
        } catch (err: any) {
          cliLog(runId, "error", "Task step error", {
            taskId: task.id,
            err: String(err),
          });
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
};
