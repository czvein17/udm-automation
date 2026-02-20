import { createBrowserWithState } from "../../shared/browserWithProfile";
import { ensureLoggedIn } from "../../shared/auth";
import { createFeatureLogger } from "../../shared/logger.util";

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

  const logger = createFeatureLogger({
    runId,
    jobId: "udm-automation",
    runnerId: `pid-${process.pid}`,
    surveyline: configSettin.surveyline ?? undefined,
    automationType: configSettin.automationType,
    translation: configSettin.translation,
    defaultCtx: {
      surveyline: configSettin.surveyline ?? undefined,
      automationType: configSettin.automationType,
    },
  });

  logger.printHeader();
  logger.startTask("udm-automation", `surveyline=${surveyline ?? "-"}`);

  await logger.debug("config", {
    configFor: configSettin.configFor,
    baseUrl: configSettin.baseUrl,
    surveyline: configSettin.surveyline,
    automationType: configSettin.automationType,
    translation: configSettin.translation,
  });

  const { browser, context, statePath } = await createBrowserWithState();
  const page = await context.newPage();

  try {
    await ensureLoggedIn({ page, context, baseUrl, statePath, logger });

    await startAutomation(configSettin, runId, context, logger);

    // ... your actual automation steps here ...
    await logger.info("job_progress", { status: "running_udm_automation" });

    // save updated cookies at end too
    await context.storageState({ path: statePath });
  } catch (err) {
    await logger.error("job_error", { err: String(err) });
    throw err;
  }
}
