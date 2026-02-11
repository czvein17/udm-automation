import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getTaskByRunId } from "server/dist/feature/youtube/youtube.service";

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
  const task = await getTaskByRunId(runId as string);
  if (!task) {
    console.error(`Task with runId ${runId} not found`);
    process.exit(1);
  }

  console.log(task);

  await jobRegistry[jobId]();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
