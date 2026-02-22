import { createBrowserWithState } from "../../shared/browserWithProfile";
import { ensureLoggedIn } from "../../shared/auth";
import { makeLogger } from "../../shared/logger";
import { createReporter } from "../../shared/reporter";

import { getConfigForService } from "@server/feature/config/config.service";
import { startAutomation } from "./start-automation";

export async function runUdmAutomation(runId: string) {
  const configSettin = await getConfigForService("udm");

  if (!configSettin) {
    throw new Error("UDM config not found");
  }

  const { baseUrl, surveyline } = configSettin;

  if (!baseUrl) {
    throw new Error("UDM config baseUrl not found");
  }

  const runnerId = `pid-${process.pid}`;

  const report = createReporter({
    runId,
    jobId: "udm-automation",
    runnerId,
    config: {
      surveyline: configSettin.surveyline ?? undefined,
      automationType: configSettin.automationType,
      translation: configSettin.translation ?? undefined,
    },
  });

  const logger = makeLogger({
    runId,
    jobId: "udm-automation",
    runnerId,
    surveyline: configSettin.surveyline ?? undefined,
    automationType: configSettin.automationType,
    translation: configSettin.translation,
  });

  await report.runStart();

  const { browser, context, statePath } = await createBrowserWithState();
  const page = await context.newPage();

  try {
    await ensureLoggedIn({ page, context, baseUrl, statePath, logger });

    await startAutomation(configSettin, runId, context, report);

    // save updated cookies at end too
    await context.storageState({ path: statePath });
  } catch (err) {
    await logger.error("run_error", { err: String(err) });
    throw err;
  } finally {
    try {
      await page.close();
    } catch {
      // ignore cleanup failures
    }

    try {
      await context.close();
    } catch {
      // ignore cleanup failures
    }

    try {
      await browser.close();
    } catch {
      // ignore cleanup failures
    }
  }
}
