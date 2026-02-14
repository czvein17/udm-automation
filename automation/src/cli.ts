import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../");

dotenv.config({ path: path.resolve(repoRoot, ".env") });

import { runOpenYoutube } from "./jobs/open-youtube";
import { runMultipleYtTabs } from "./jobs/open-multiple";

const jobRegistry = {
  "open-youtube": (runId: string) => runOpenYoutube(runId),
  "open-youtube-multiple": (runId: string) => runMultipleYtTabs(runId),
  // "re-approve": runReApprove,
  // "re-approve translation": runReApproveTranslation,
  // "add-applicabilites": runAddApplicabilities,
  // "add-applicabilites translation": runAddApplicabilitiesTranslation,
} as const;

type JobId = keyof typeof jobRegistry;

const jobId = process.argv[2] as JobId;
const runId = process.argv[3] as string;

if (!jobId || (!(jobId in jobRegistry) && !runId)) {
  console.error("Usage: bunx tsx src/cli.ts <jobId> <runId>");
  process.exit(1);
}

async function main() {
  await jobRegistry[jobId](runId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
