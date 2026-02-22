import type { Config } from "@server/db/schema";

import * as automationService from "server/dist/feature/automation/automation.service";
import * as TaskService from "server/dist/feature/task/task.service";

import { buildRecordUrl } from "../../util/buildUrl";

import { getElementStatus } from "../../actions/udm-actions/checkElementStatus";
import { selectLanguage } from "../../actions/udm-actions/selectLanguage";

import { editAttributes } from "./edit-attibutes";
import { reApprove } from "./re-approve";
import { checkFieldName } from "../../actions/udm-actions/checkFieldName";
import type { Reporter } from "../../shared/reporter";
import {
  appendTaskLog,
  toTitleCase,
  toUserErrorMessage,
} from "../../util/logging.util";
import { editApplicabilities } from "./edit-applicabilities";

export const startAutomation = async (
  config: Config,
  runId: string,
  context: any,
  report: Reporter,
) => {
  const taskList = await automationService.getTasksByRunId(runId);

  if (!taskList || taskList.length === 0) {
    throw new Error("No tasks found for runId: " + runId);
  }

  const BATCH_SIZE = 3;
  for (let i = 0; i < taskList.length; i += BATCH_SIZE) {
    const chunk = taskList.slice(i, i + BATCH_SIZE);

    await Promise.all(
      chunk.map(async (task, chunkIndex) => {
        const rowIndex = i + chunkIndex + 1;
        const page = await context.newPage();

        const tableName = task.tableName;
        const elementId = task.elementId;

        const url = buildRecordUrl(
          `${config.baseUrl!}/${config.surveyline}`,
          tableName,
          elementId,
        );

        const row = report.row({
          rowIndex,
          taskId: task.id,
          fieldName: task.fieldName,
          elementId: task.elementId,
          elementName: task.elementName ?? undefined,
          displayName: task.displayName ?? undefined,
          tableName: task.tableName,
          url,
        });

        try {
          await page.bringToFront();

          await appendTaskLog(task.id, [
            { status: "loading", action: "navigate to record" },
          ]);

          await row.step("Navigate", { url });

          await page.goto(url, { waitUntil: "domcontentloaded" });

          await page.bringToFront();
          await page.waitForTimeout(300);

          const status = await getElementStatus(page);

          await row.step("Element status", { status: toTitleCase(status) });
          if (status === "approved") {
            await appendTaskLog(task.id, [
              { status: "success", action: "Element Approve " },
            ]);
          } else {
            await appendTaskLog(task.id, [
              { status: "failed", action: "element not approved" },
            ]);
          }
          // CHECK: If the field name on the page doesn't match the task.fieldName, skip this task.
          try {
            const { match, found } = await checkFieldName(page, task.fieldName);
            if (!match) {
              await row.fail("FIELD_NAME_MISMATCH", {
                message: `Expected ${task.fieldName}, found ${found ?? "Unknown"}`,
                hint: "Check task source field mapping",
              });

              await appendTaskLog(task.id, [
                {
                  status: "failed",
                  action: `field name mismatch expected:${task.fieldName} found:${found}`,
                },
              ]);

              // skip further automation for this task
              return;
            }

            console.log("FIELD NAME MATCH");
          } catch (err: any) {
            await row.fail("FIELD_NAME_CHECK_ERROR", {
              message: err?.message ?? String(err),
              hint: "Review field-name selector",
            });
            await appendTaskLog(task.id, [
              {
                status: "failed",
                action: `field name check error: ${toUserErrorMessage(err)}`,
              },
            ]);
            return;
          }

          // Translation: only select language when it's not English
          try {
            const translation = String(config.translation ?? "");
            const tl = translation.toLowerCase();
            if (tl !== "english" && tl !== "english (default)") {
              await row.step("Language select", { value: translation });

              // attempt a Ctrl+Tab to avoid focus lock, then select language
              try {
                await page.keyboard.press("Control+Tab");
              } catch (e) {
                /* ignore if keyboard not available */
              }

              try {
                await selectLanguage(page, translation);
                await row.step("Language selected", { value: translation });
                await row.step("Language applied", { value: translation });
              } catch (err: any) {
                await row.fail("LANGUAGE_SELECTION_FAILED", {
                  message: err?.message ?? String(err),
                  hint: `Target language: ${translation}`,
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
            await row.fail("LANGUAGE_BLOCK_ERROR", {
              message: err instanceof Error ? err.message : String(err),
            });
          }

          // Run automation specific action
          const automationType = String(config.automationType ?? "")
            .trim()
            .toLowerCase();

          switch (automationType) {
            case "udm:open_elem":
            case "udm:open_open_elem":
              await row.step("Automation action", { action: "Open Element" });
              console.log("OPENING ELEMENTS");

              break;

            case "udm:re-approve":
              await row.step("Automation action", { action: "Re-Approve" });
              console.log("RE-APPROVING ELEMENTS");
              page.bringToFront();
              await reApprove(page, row);

              break;

            case "udm:edit_attributes":
              await row.step("Automation action", {
                action: "Edit Attributes",
              });
              await editAttributes(page, task, row);
              break;

            case "udm:edit_applicabilities":
              await row.step("Automation action", {
                action: "Edit Applicabilities",
              });
              await editApplicabilities(page, task, row);
              break;

            default:
              await row.warn("Automation skipped", {
                automationType: config.automationType,
                reason: "No mapped automation action",
              });
              break;
          }

          await row.ok("Completed");
        } catch (err: any) {
          await row.fail("TASK_STEP_ERROR", {
            message: toUserErrorMessage(err),
            hint: "See task logs for backend context",
          });
          await appendTaskLog(task.id, [
            { status: "failed", action: `error: ${toUserErrorMessage(err)}` },
          ]);
        }
      }),
    );
  }
};
