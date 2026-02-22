export type RunStatus = "RUNNING" | "SUCCESS" | "FAILED";

export type Run = {
  runId: string;
  jobId: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  error?: string;
  logs: string[];
};

const runs = new Map<string, Run>();
const MAX_IN_MEMORY_RUNS = Number(process.env.MAX_IN_MEMORY_RUNS ?? "200");
const MAX_RUN_LOG_LINES = Number(process.env.MAX_RUN_LOG_LINES ?? "2000");
const COMPLETED_RUN_TTL_MS = Number(process.env.COMPLETED_RUN_TTL_MS ?? "1800000");

function sanitizePositiveInt(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

const SAFE_MAX_IN_MEMORY_RUNS = sanitizePositiveInt(MAX_IN_MEMORY_RUNS, 200);
const SAFE_MAX_RUN_LOG_LINES = sanitizePositiveInt(MAX_RUN_LOG_LINES, 2000);
const SAFE_COMPLETED_RUN_TTL_MS = sanitizePositiveInt(COMPLETED_RUN_TTL_MS, 1800000);

function runFinishedAtMs(run: Run) {
  if (!run.finishedAt) return null;
  const finishedAtMs = new Date(run.finishedAt).getTime();
  return Number.isFinite(finishedAtMs) ? finishedAtMs : null;
}

function cleanupCompletedRuns(nowMs = Date.now()) {
  for (const [runId, run] of runs) {
    const finishedAtMs = runFinishedAtMs(run);
    if (finishedAtMs == null) continue;
    if (nowMs - finishedAtMs <= SAFE_COMPLETED_RUN_TTL_MS) continue;
    runs.delete(runId);
  }
}

function evictIfNeeded() {
  while (runs.size > SAFE_MAX_IN_MEMORY_RUNS) {
    let victimId: string | null = null;

    for (const [runId, run] of runs) {
      if (run.status !== "RUNNING") {
        victimId = runId;
        break;
      }
      if (victimId == null) victimId = runId;
    }

    if (!victimId) return;
    runs.delete(victimId);
  }
}

export function createRun(runId: string, jobId: string) {
  cleanupCompletedRuns();

  runs.set(runId, {
    runId,
    jobId,
    status: "RUNNING",
    startedAt: new Date().toISOString(),
    logs: [],
  });

  evictIfNeeded();
}

export function getRun(runId: string) {
  cleanupCompletedRuns();
  return runs.get(runId);
}

export function appendLog(runId: string, line: string) {
  const run = runs.get(runId);
  if (!run) return;
  run.logs.push(line);

  const overflow = run.logs.length - SAFE_MAX_RUN_LOG_LINES;
  if (overflow > 0) {
    run.logs.splice(0, overflow);
  }
}

export function finishRun(runId: string, patch: Partial<Run>) {
  const run = runs.get(runId);
  if (!run) return;
  Object.assign(run, patch);
  cleanupCompletedRuns();
  evictIfNeeded();
}
