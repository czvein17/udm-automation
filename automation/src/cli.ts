import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { automationLog } from "./util/runtimeLogger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../");

dotenv.config({ path: path.resolve(repoRoot, ".env") });

// set a friendly process title so the runtime is easier to identify in process lists
process.title = "udm-automation-worker";

import { runUdmAutomation } from "./jobs/udm-automation";

const jobRegistry = {
  "udm-automation": (runId: string) => runUdmAutomation(runId),
  // "re-approve": runReApprove,
  // "re-approve translation": runReApproveTranslation,
  // "add-applicabilites": runAddApplicabilities,
  // "add-applicabilites translation": runAddApplicabilitiesTranslation,
} as const;

type JobId = keyof typeof jobRegistry;

const jobId = process.argv[2] as JobId;
const runId = process.argv[3] as string;

if (!jobId || !runId || !(jobId in jobRegistry)) {
  automationLog.error("cli.invalid_args", {
    usage: "bunx tsx src/cli.ts <jobId> <runId>",
    validJobIds: Object.keys(jobRegistry).join(", "),
  });
  process.exit(1);
}

async function main() {
  automationLog.info("cli.start", {
    args: process.argv.slice(2),
    jobId,
    handler: jobRegistry[jobId]?.name ?? "<anonymous>",
  });

  await jobRegistry[jobId](runId);
}

main().catch((err) => {
  automationLog.error("cli.failed", {
    result: "failed",
    error: err instanceof Error ? err.message : String(err),
  });
});
