import type { Config } from "@server/db/schema";

import * as YTService from "server/dist/feature/youtube/youtube.service";
import * as TaskService from "server/dist/feature/task/task.service";

import { buildRecordUrl } from "../../util/buildUrl";
import { cliLog } from "../../shared/cli-log";

import { getElementStatus } from "../../actions/udm-actions/checkElementStatus";
import { selectLanguage } from "../../actions/udm-actions/selectLanguage";

import { editAttributes } from "./edit-attibutes";
import { reApprove } from "./re-approve";
import { checkFieldName } from "../../actions/udm-actions/checkFieldName";

export const startAutomation = async (
  config: Config,
  runId: string,
  context: any,
) => {
  const taskList = await YTService.getTasksByRunId(runId);

  if (!taskList || taskList.length === 0) {
    throw new Error("No tasks found for runId: " + runId);
  }

  const BATCH_SIZE = 2;
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
          // CHECK: If the field name on the page doesn't match the task.fieldName, skip this task.
          try {
            const { match, found } = await checkFieldName(page, task.fieldName);
            if (!match) {
              cliLog(runId, "info", "field_name_mismatch", {
                taskId: task.id,
                expected: task.fieldName,
                found,
              });

              await TaskService.createTaskLogs({
                taskId: task.id,
                logs: [
                  {
                    status: "failed",
                    action: `field name mismatch expected:${task.fieldName} found:${found}`,
                  },
                ],
              });

              // skip further automation for this task
              return;
            }

            console.log("FIELD NAME MATCH");
          } catch (err: any) {
            cliLog(runId, "error", "field_name_check_error", {
              taskId: task.id,
              err: String(err),
            });
            await TaskService.createTaskLogs({
              taskId: task.id,
              logs: [
                {
                  status: "failed",
                  action: `field name check error: ${err?.message ?? err}`,
                },
              ],
            });
            return;
          }

          // Translation: only select language when it's not English
          try {
            const translation = String(config.translation ?? "");
            const tl = translation.toLowerCase();
            if (tl !== "english" && tl !== "english (default)") {
              cliLog(runId, "info", "language_select_attempt", {
                translation,
                taskId: task.id,
              });

              // attempt a Ctrl+Tab to avoid focus lock, then select language
              try {
                await page.keyboard.press("Control+Tab");
              } catch (e) {
                /* ignore if keyboard not available */
              }

              try {
                await selectLanguage(page, translation);
                cliLog(runId, "info", "language_selected", {
                  translation,
                  taskId: task.id,
                });
              } catch (err: any) {
                cliLog(runId, "error", "language_selection_failed", {
                  taskId: task.id,
                  err: String(err),
                });
              }

              // nudge focus forward so automation continues
              try {
                await page.waitForTimeout(250);
                await page.keyboard.press("Tab");
              } catch (e) {
                // ignore
              }
            }
          } catch (err) {
            cliLog(runId, "error", "language_block_error", {
              err: String(err),
            });
          }

          // Run automation specific action
          switch (config.automationType) {
            case "udm:open_open_elem":
              cliLog(runId, "info", "automation_action", {
                action: "open_open_elem",
                taskId: task.id,
              });

              console.log("OPENING ELEMENTS");
              break;

            case "udm:re-approve":
              cliLog(runId, "info", "automation_action", {
                action: "re-approve",
                taskId: task.id,
              });

              console.log("RE-APPROVING ELEMENTS");
              await reApprove(page);

              break;

            case "udm:edit_attributes":
              cliLog(runId, "info", "automation_action", {
                action: "edit_attributes",
                taskId: task.id,
              });
              await editAttributes(page, task);
              break;

            default:
              cliLog(runId, "debug", "automation_action_skipped", {
                automationType: config.automationType,
                taskId: task.id,
              });
              break;
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
