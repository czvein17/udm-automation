import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../");

dotenv.config({ path: path.resolve(repoRoot, ".env") });

// set a friendly process title so the runtime is easier to identify in process lists
process.title = "udm-automation-worker";

import { runOpenYoutube } from "./jobs/open-youtube";
import { runMultipleYtTabs } from "./jobs/open-multiple";
import { runUdmAutomation } from "./jobs/udm-automation";

const jobRegistry = {
  "open-youtube": (runId: string) => runOpenYoutube(runId),
  "open-youtube-multiple": (runId: string) => runMultipleYtTabs(runId),
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
  console.error("Usage: bunx tsx src/cli.ts <jobId> <runId>");
  console.error("Valid jobIds:", Object.keys(jobRegistry).join(", "));
  process.exit(1);
}

async function main() {
  console.log("CLI args:", process.argv.slice(2));
  console.log("Selected jobId:", jobId);
  console.log("Resolved handler:", jobRegistry[jobId]?.name ?? "<anonymous>");

  await jobRegistry[jobId](runId);
}

main().catch((err) => {
  console.error(err);
});
