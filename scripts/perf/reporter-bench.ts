import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

type BenchSummary = {
  label: string;
  timestamp: string;
  baseUrl: string;
  runId: string;
  history: {
    requests: number;
    limit: number;
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    minMs: number;
    maxMs: number;
  };
  ingest: {
    events: number;
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    minMs: number;
    maxMs: number;
  };
};

function getArg(name: string) {
  const match = process.argv.find((value) => value.startsWith(`--${name}=`));
  return match ? match.split("=")[1] : undefined;
}

function percentile(values: number[], q: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)));
  return sorted[index] ?? 0;
}

function summarize(timesMs: number[]) {
  const total = timesMs.reduce((sum, value) => sum + value, 0);
  const avgMs = timesMs.length > 0 ? total / timesMs.length : 0;
  return {
    avgMs,
    p50Ms: percentile(timesMs, 0.5),
    p95Ms: percentile(timesMs, 0.95),
    minMs: timesMs.length > 0 ? Math.min(...timesMs) : 0,
    maxMs: timesMs.length > 0 ? Math.max(...timesMs) : 0,
  };
}

async function benchmarkHistory(params: {
  baseUrl: string;
  requests: number;
  limit: number;
}) {
  const durations: number[] = [];

  for (let index = 0; index < params.requests; index += 1) {
    const startedAt = performance.now();
    const response = await fetch(
      `${params.baseUrl}/api/v1/reporter/runs?limit=${params.limit}`,
    );

    if (!response.ok) {
      throw new Error(`History request failed with status ${response.status}`);
    }

    await response.text();
    durations.push(performance.now() - startedAt);
  }

  return summarize(durations);
}

async function benchmarkIngest(params: {
  baseUrl: string;
  runId: string;
  events: number;
}) {
  const durations: number[] = [];

  for (let index = 0; index < params.events; index += 1) {
    const startedAt = performance.now();
    const response = await fetch(
      `${params.baseUrl}/api/v1/reporter/runs/${encodeURIComponent(params.runId)}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: globalThis.crypto.randomUUID(),
          runId: params.runId,
          jobId: "perf-bench",
          runnerId: "perf-runner",
          ts: new Date().toISOString(),
          level: "info",
          message: "row_step",
          meta: {
            type: "row_step",
            runId: params.runId,
            rowIndex: index + 1,
            title: "Perf bench step",
            details: { index },
          },
          ctx: {
            taskId: `task-${index + 1}`,
            rowIndex: index + 1,
            fieldName: "field",
            elementId: `${index + 1}`,
            tableName: "COMPANYDATA",
          },
          source: "automation",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Ingest request failed with status ${response.status}`);
    }

    await response.text();
    durations.push(performance.now() - startedAt);
  }

  return summarize(durations);
}

async function maybeWriteResult(result: BenchSummary, outFile?: string) {
  if (!outFile) return;

  const outputPath = path.resolve(process.cwd(), outFile);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await appendFile(outputPath, `${JSON.stringify(result)}\n`, "utf8");
}

async function main() {
  const baseUrl = getArg("baseUrl") ?? process.env.PERF_BASE_URL ?? "http://localhost:3000";
  const runId =
    getArg("runId") ?? process.env.PERF_RUN_ID ?? `perf-run-${Date.now().toString(36)}`;
  const label = getArg("label") ?? process.env.PERF_LABEL ?? "unlabeled";
  const outFile = getArg("out") ?? process.env.PERF_OUT;

  const historyRequests = Number(getArg("historyRequests") ?? "20");
  const historyLimit = Number(getArg("historyLimit") ?? "80");
  const ingestEvents = Number(getArg("ingestEvents") ?? "120");

  const history = await benchmarkHistory({
    baseUrl,
    requests: Number.isFinite(historyRequests) ? historyRequests : 20,
    limit: Number.isFinite(historyLimit) ? historyLimit : 80,
  });

  const ingest = await benchmarkIngest({
    baseUrl,
    runId,
    events: Number.isFinite(ingestEvents) ? ingestEvents : 120,
  });

  const result: BenchSummary = {
    label,
    timestamp: new Date().toISOString(),
    baseUrl,
    runId,
    history: {
      requests: Number.isFinite(historyRequests) ? historyRequests : 20,
      limit: Number.isFinite(historyLimit) ? historyLimit : 80,
      ...history,
    },
    ingest: {
      events: Number.isFinite(ingestEvents) ? ingestEvents : 120,
      ...ingest,
    },
  };

  await maybeWriteResult(result, outFile);

  console.log("Reporter benchmark completed");
  console.log(JSON.stringify(result, null, 2));
}

void main().catch((error) => {
  console.error("Reporter benchmark failed", error);
  process.exit(1);
});
