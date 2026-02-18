import { createBrowserWithState } from "../../shared/browserWithProfile";
import { ensureLoggedIn } from "../../shared/auth";
import { makeLogger } from "../../shared/logger";
import { cliLog } from "../../shared/cli-log";

import { getConfigForService } from "@server/feature/config/config.service";
import { startAutomation } from "./start-automation";

export async function runUdmAutomation(runId: string) {
  const logger = makeLogger(runId);

  const configSettin = await getConfigForService("udm");

  if (!configSettin) {
    throw new Error("UDM config not found");
  }

  const { baseUrl, surveyline } = configSettin;

  if (!baseUrl) {
    throw new Error("UDM config baseUrl not found");
  }

  cliLog(runId, "debug", "config", configSettin);

  const { browser, context, statePath } = await createBrowserWithState();
  const page = await context.newPage();

  try {
    await ensureLoggedIn({ page, context, baseUrl, statePath, logger });

    await startAutomation(configSettin, runId, context);

    // ... your actual automation steps here ...
    logger.info("🚀 Running UDM automation steps...");

    // save updated cookies at end too
    await context.storageState({ path: statePath });
  } catch (err) {
    cliLog(runId, "error", "job_error", { err: String(err) });
    logger.error?.(String(err));
    throw err;
  }
}
