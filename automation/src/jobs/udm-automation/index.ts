import { createBrowserWithState } from "../../shared/browserWithProfile";
import { ensureLoggedIn } from "../../shared/auth";

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

  const logger = {
    info: (...args: unknown[]) => console.log(...args),
    error: (...args: unknown[]) => console.error(...args),
  };

  const { browser, context, statePath } = await createBrowserWithState();
  const page = await context.newPage();

  try {
    await ensureLoggedIn({ page, context, baseUrl, statePath, logger });

    await startAutomation(configSettin, runId, context);

    // save updated cookies at end too
    await context.storageState({ path: statePath });
  } catch (err) {
    logger.error("run_error", { err: String(err) });
    throw err;
  }
}
