import type { Config } from "@server/db/schema";

import * as automationService from "server/dist/feature/automation/automation.service";

import { buildRecordUrl } from "../../util/buildUrl";

import { getElementStatus } from "../../actions/udm-actions/checkElementStatus";
import { selectLanguage } from "../../actions/udm-actions/selectLanguage";

import { editAttributes } from "./edit-attibutes";
import { reApprove } from "./re-approve";
import { checkFieldName } from "../../actions/udm-actions/checkFieldName";
import { editApplicabilities } from "./edit-applicabilities";

export const startAutomation = async (
  config: Config,
  runId: string,
  context: any,
) => {
  const taskList = await automationService.getTasksByRunId(runId);

  if (!taskList || taskList.length === 0) {
    throw new Error("No tasks found for runId: " + runId);
  }

  const BATCH_SIZE = 5;
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

        try {
          await page.bringToFront();

          await page.goto(url, { waitUntil: "domcontentloaded" });

          await page.bringToFront();
          await page.waitForTimeout(300);

          const status = await getElementStatus(page);
          console.log("Element status", status);

          // CHECK: If the field name on the page doesn't match the task.fieldName, skip this task.
          try {
            const { match, found } = await checkFieldName(page, task.fieldName);
            if (!match) {
              console.error(
                `FIELD_NAME_MISMATCH expected:${task.fieldName} found:${found ?? "Unknown"}`,
              );

              // skip further automation for this task
              return;
            }

            console.log("FIELD NAME MATCH");
          } catch (err: any) {
            console.error("FIELD_NAME_CHECK_ERROR", err?.message ?? String(err));
            return;
          }

          // Translation: only select language when it's not English
          try {
            const translation = String(config.translation ?? "");
            const tl = translation.toLowerCase();
            if (tl !== "english" && tl !== "english (default)") {
              // attempt a Ctrl+Tab to avoid focus lock, then select language
              try {
                await page.keyboard.press("Control+Tab");
              } catch (e) {
                /* ignore if keyboard not available */
              }

              try {
                await selectLanguage(page, translation);
              } catch (err: any) {
                console.error("LANGUAGE_SELECTION_FAILED", {
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
            console.error("LANGUAGE_BLOCK_ERROR", err);
          }

          // Run automation specific action
          const automationType = String(config.automationType ?? "")
            .trim()
            .toLowerCase();

          switch (automationType) {
            case "udm:open_elem":
            case "udm:open_open_elem":
              console.log("OPENING ELEMENTS");

              break;

            case "udm:re-approve":
              console.log("RE-APPROVING ELEMENTS");
              page.bringToFront();
              await reApprove(page);

              break;

            case "udm:edit_attributes":
              await editAttributes(page, task);
              break;

            case "udm:edit_applicabilities":
              await editApplicabilities(page, task);
              break;

            default:
              console.warn("Automation skipped", {
                automationType: config.automationType,
                reason: "No mapped automation action",
              });
              break;
          }
        } catch (err: any) {
          console.error("TASK_STEP_ERROR", err?.message ?? String(err));
        }
      }),
    );
  }
};
