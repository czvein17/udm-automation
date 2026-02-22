import { readFile } from "node:fs/promises";
import path from "node:path";

type BenchSample = {
  label: string;
  timestamp: string;
  history: {
    avgMs: number;
    p95Ms: number;
  };
  ingest: {
    avgMs: number;
    p95Ms: number;
  };
};

type BenchSummary = {
  label: string;
  samples: number;
  historyAvgMs: number;
  historyP95Ms: number;
  ingestAvgMs: number;
  ingestP95Ms: number;
};

function getArg(name: string) {
  const match = process.argv.find((value) => value.startsWith(`--${name}=`));
  return match ? match.split("=")[1] : undefined;
}

function toFixed(value: number) {
  return Number.isFinite(value) ? value.toFixed(3) : "0.000";
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarize(samples: BenchSample[]): BenchSummary {
  return {
    label: samples[0]?.label ?? "unknown",
    samples: samples.length,
    historyAvgMs: average(samples.map((sample) => Number(sample.history.avgMs ?? 0))),
    historyP95Ms: average(samples.map((sample) => Number(sample.history.p95Ms ?? 0))),
    ingestAvgMs: average(samples.map((sample) => Number(sample.ingest.avgMs ?? 0))),
    ingestP95Ms: average(samples.map((sample) => Number(sample.ingest.p95Ms ?? 0))),
  };
}

function percentDelta(current: number, baseline: number) {
  if (!baseline) return 0;
  return ((current - baseline) / baseline) * 100;
}

function markdownTable(summaries: BenchSummary[]) {
  const header =
    "| Label | Samples | History avg (ms) | History p95 (ms) | Ingest avg (ms) | Ingest p95 (ms) |\n|---|---:|---:|---:|---:|---:|";

  const rows = summaries.map(
    (summary) =>
      `| ${summary.label} | ${summary.samples} | ${toFixed(summary.historyAvgMs)} | ${toFixed(summary.historyP95Ms)} | ${toFixed(summary.ingestAvgMs)} | ${toFixed(summary.ingestP95Ms)} |`,
  );

  return `${header}\n${rows.join("\n")}`;
}

async function main() {
  const sourceArg = getArg("source") ?? "artifacts/perf/reporter-bench.ndjson";
  const baselineLabel = getArg("baseline");
  const compareLabel = getArg("compare");
  const sourcePath = path.resolve(process.cwd(), sourceArg);

  const raw = await readFile(sourcePath, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const samples: BenchSample[] = lines.map((line) => JSON.parse(line) as BenchSample);
  const grouped = new Map<string, BenchSample[]>();

  for (const sample of samples) {
    const bucket = grouped.get(sample.label) ?? [];
    bucket.push(sample);
    grouped.set(sample.label, bucket);
  }

  const summaries = Array.from(grouped.values())
    .map((group) => summarize(group))
    .sort((a, b) => a.label.localeCompare(b.label));

  console.log(markdownTable(summaries));

  if (baselineLabel && compareLabel) {
    const baseline = summaries.find((summary) => summary.label === baselineLabel);
    const current = summaries.find((summary) => summary.label === compareLabel);

    if (!baseline || !current) {
      throw new Error("Baseline or compare label not found in source data");
    }

    console.log("\nDelta (compare vs baseline)");
    console.log(
      `- History avg: ${toFixed(current.historyAvgMs)} ms (${toFixed(percentDelta(current.historyAvgMs, baseline.historyAvgMs))}%)`,
    );
    console.log(
      `- History p95: ${toFixed(current.historyP95Ms)} ms (${toFixed(percentDelta(current.historyP95Ms, baseline.historyP95Ms))}%)`,
    );
    console.log(
      `- Ingest avg: ${toFixed(current.ingestAvgMs)} ms (${toFixed(percentDelta(current.ingestAvgMs, baseline.ingestAvgMs))}%)`,
    );
    console.log(
      `- Ingest p95: ${toFixed(current.ingestP95Ms)} ms (${toFixed(percentDelta(current.ingestP95Ms, baseline.ingestP95Ms))}%)`,
    );
  }
}

void main().catch((error) => {
  console.error("Failed to summarize benchmarks", error);
  process.exit(1);
});
