import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../");

dotenv.config({ path: path.resolve(repoRoot, ".env") });

import { runOpenYoutube } from "./jobs/open-youtube";

const jobRegistry = {
  "open-youtube": runOpenYoutube,
  // "re-approve": runReApprove,
  // "re-approve translation": runReApproveTranslation,
  // "add-applicabilites": runAddApplicabilities,
  // "add-applicabilites translation": runAddApplicabilitiesTranslation,
} as const;

type JobId = keyof typeof jobRegistry;

const jobId = process.argv[2] as JobId;
const runId = process.argv[3];

console.log(runId);

if (!jobId || !(jobId in jobRegistry)) {
  console.error("Usage: bunx tsx src/cli.ts <jobId>");
  process.exit(1);
}

async function main() {
  await jobRegistry[jobId]();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
