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

export function createRun(runId: string, jobId: string) {
  runs.set(runId, {
    runId,
    jobId,
    status: "RUNNING",
    startedAt: new Date().toISOString(),
    logs: [],
  });
}

export function getRun(runId: string) {
  return runs.get(runId);
}

export function appendLog(runId: string, line: string) {
  const run = runs.get(runId);
  if (!run) return;
  run.logs.push(line);
}

export function finishRun(runId: string, patch: Partial<Run>) {
  const run = runs.get(runId);
  if (!run) return;
  Object.assign(run, patch);
}
