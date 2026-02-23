import { createBrowserWithState } from "../../shared/browserWithProfile";
import { ensureLoggedIn } from "../../shared/auth";

import { getConfigFor } from "../../services/automationApi";
import { automationLog } from "../../util/runtimeLogger";
import { startAutomation } from "./start-automation";

export async function runUdmAutomation(runId: string) {
  const configSetting = await getConfigFor("udm");

  const { baseUrl, surveyline } = configSetting;

  if (!baseUrl) {
    throw new Error("UDM config baseUrl not found");
  }

  const logger = {
    info: (event: string, context?: Record<string, unknown>) =>
      automationLog.info(event, context),
    error: (event: string, context?: Record<string, unknown>) =>
      automationLog.error(event, context),
  };

  const { browser, context, statePath } = await createBrowserWithState();
  const page = await context.newPage();

  try {
    await ensureLoggedIn({ page, context, baseUrl, statePath, logger });

    await startAutomation(configSetting, runId, context);

    // save updated cookies at end too
    await context.storageState({ path: statePath });
  } catch (err) {
    logger.error("run.error", { error: String(err), runId });
    throw err;
  }
}
