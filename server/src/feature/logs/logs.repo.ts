import { db } from "@server/db/client";
import { automationLogs, reporterRunSummaries } from "@server/db/schema";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import type { LogEvent } from "./logs.schema";

type LogRow = typeof automationLogs.$inferSelect;
type SummaryRow = typeof reporterRunSummaries.$inferSelect;

const runSeqCache = new Map<string, number>();
let seqMutex: Promise<void> = Promise.resolve();

function isBusyError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error);

  return /SQLITE_BUSY|database is locked/i.test(message);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withBusyRetry<T>(fn: () => Promise<T>): Promise<T> {
  const delaysMs = [20, 50, 100, 180, 300];

  for (let attempt = 0; attempt <= delaysMs.length; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      const isBusy = isBusyError(error);
      if (!isBusy || attempt === delaysMs.length) {
        throw error;
      }

      await sleep(delaysMs[attempt]!);
    }
  }

  throw new Error("Unexpected retry flow");
}

function toLogEvent(row: LogRow): LogEvent {
  const decoded = row.metaJson
    ? (JSON.parse(row.metaJson) as
        | {
            meta?: Record<string, unknown>;
            ctx?: LogEvent["ctx"];
            source?: LogEvent["source"];
          }
        | Record<string, unknown>)
    : undefined;

  const meta =
    decoded && "meta" in decoded
      ? (decoded.meta as Record<string, unknown> | undefined)
      : (decoded as Record<string, unknown> | undefined);

  const ctx =
    decoded && "ctx" in decoded
      ? (decoded.ctx as LogEvent["ctx"] | undefined)
      : undefined;

  const source =
    decoded && "source" in decoded && decoded.source === "server"
      ? "server"
      : "automation";

  return {
    id: row.id,
    runId: row.runId,
    jobId: row.jobId ?? undefined,
    runnerId: row.runnerId ?? undefined,
    ts: row.ts,
    level: row.level as LogEvent["level"],
    message: row.message,
    meta,
    ctx,
    raw: row.raw ?? undefined,
    source,
  };
}

async function getNextSeq(runId: string): Promise<number> {
  const cached = runSeqCache.get(runId);
  if (cached !== undefined) {
    const next = cached + 1;
    runSeqCache.set(runId, next);
    return next;
  }

  const rows = await withBusyRetry(() =>
    db
      .select({ maxSeq: sql<number>`coalesce(max(${automationLogs.seq}), 0)` })
      .from(automationLogs)
      .where(eq(automationLogs.runId, runId)),
  );

  const maxSeq = rows[0]?.maxSeq ?? 0;
  const next = maxSeq + 1;
  runSeqCache.set(runId, next);
  return next;
}

async function reserveNextSeq(runId: string): Promise<number> {
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  const previous = seqMutex;
  seqMutex = seqMutex.then(() => current);

  await previous;

  try {
    return await getNextSeq(runId);
  } finally {
    release();
  }
}

type ReporterRunSummary = {
  runId: string;
  jobId?: string;
  runnerId?: string;
  firstTs: string;
  lastTs: string;
  totalEvents: number;
  errorCount: number;
  warnCount: number;
  status: "ok" | "fail" | "running";
  latestMessage: string;
};

function toSummaryStatus(value: unknown): ReporterRunSummary["status"] {
  const status = String(value ?? "").toLowerCase();
  if (status === "ok" || status === "fail") return status;
  return "running";
}

function getEventSummaryStatus(event: LogEvent): ReporterRunSummary["status"] {
  if (event.message !== "row_end") return "running";

  const status =
    event.meta && typeof event.meta === "object" && "status" in event.meta
      ? (event.meta as Record<string, unknown>).status
      : undefined;

  return toSummaryStatus(status);
}

function mapSummaryRow(row: SummaryRow): ReporterRunSummary {
  return {
    runId: row.runId,
    jobId: row.jobId ?? undefined,
    runnerId: row.runnerId ?? undefined,
    firstTs: row.firstTs,
    lastTs: row.lastTs,
    totalEvents: row.totalEvents,
    errorCount: row.errorCount,
    warnCount: row.warnCount,
    status: toSummaryStatus(row.status),
    latestMessage: row.latestMessage,
  };
}

async function upsertRunSummary(event: LogEvent, seq: number) {
  const existing = await withBusyRetry(() =>
    db
      .select()
      .from(reporterRunSummaries)
      .where(eq(reporterRunSummaries.runId, event.runId))
      .limit(1),
  );

  const current = existing[0];
  const eventStatus = getEventSummaryStatus(event);

  if (!current) {
    await withBusyRetry(() =>
      db.insert(reporterRunSummaries).values({
        runId: event.runId,
        jobId: event.jobId ?? null,
        runnerId: event.runnerId ?? null,
        firstTs: event.ts,
        lastTs: event.ts,
        totalEvents: 1,
        errorCount: event.level === "error" ? 1 : 0,
        warnCount: event.level === "warn" ? 1 : 0,
        status: eventStatus,
        latestMessage: event.message,
        lastSeq: seq,
      }),
    );
    return;
  }

  const nextStatus: ReporterRunSummary["status"] =
    current.status === "fail" || eventStatus === "fail"
      ? "fail"
      : eventStatus === "ok"
        ? "ok"
        : toSummaryStatus(current.status);

  await withBusyRetry(() =>
    db
      .update(reporterRunSummaries)
      .set({
        jobId: current.jobId ?? event.jobId ?? null,
        runnerId: current.runnerId ?? event.runnerId ?? null,
        firstTs: event.ts < current.firstTs ? event.ts : current.firstTs,
        lastTs: event.ts > current.lastTs ? event.ts : current.lastTs,
        totalEvents: current.totalEvents + 1,
        errorCount: current.errorCount + (event.level === "error" ? 1 : 0),
        warnCount: current.warnCount + (event.level === "warn" ? 1 : 0),
        status: nextStatus,
        latestMessage: event.message,
        lastSeq: Math.max(current.lastSeq, seq),
      })
      .where(eq(reporterRunSummaries.runId, event.runId)),
  );
}

export async function insertLog(event: LogEvent) {
  const seq = await reserveNextSeq(event.runId);
  const id = event.id || globalThis.crypto.randomUUID();

  await withBusyRetry(() =>
    db.insert(automationLogs).values({
      id,
      runId: event.runId,
      jobId: event.jobId ?? null,
      runnerId: event.runnerId ?? null,
      ts: event.ts,
      level: event.level,
      message: event.message,
      metaJson:
        event.meta || event.ctx || event.source === "server"
          ? JSON.stringify({
              meta: event.meta,
              ctx: event.ctx,
              source: event.source,
            })
          : null,
      raw: event.raw ?? null,
      seq,
    }),
  );

  try {
    await upsertRunSummary({ ...event, id }, seq);
  } catch (error) {
    console.warn("Reporter run summary update failed", {
      runId: event.runId,
      err: error instanceof Error ? error.message : String(error),
    });
  }

  return { ...event, id, seq };
}

export async function getLogs(runId: string, cursor?: number, limit = 200) {
  const safeLimit = Math.min(Math.max(limit, 1), 500);

  const rows = await db
    .select()
    .from(automationLogs)
    .where(
      cursor
        ? and(eq(automationLogs.runId, runId), lt(automationLogs.seq, cursor))
        : eq(automationLogs.runId, runId),
    )
    .orderBy(desc(automationLogs.seq))
    .limit(safeLimit);

  const items = rows.reverse().map(toLogEvent);
  const nextCursor =
    rows.length === safeLimit ? (rows[rows.length - 1]?.seq ?? null) : null;

  return {
    items,
    nextCursor,
  };
}

function safeJsonParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getRunSummaries(limit = 80, scanLimit = 5000) {
  const safeLimit = Math.min(Math.max(limit, 1), 500);

  const summaryRows = await db
    .select()
    .from(reporterRunSummaries)
    .orderBy(desc(reporterRunSummaries.lastSeq))
    .limit(safeLimit);

  if (summaryRows.length > 0) {
    return summaryRows.map(mapSummaryRow);
  }

  const safeScanLimit = Math.min(Math.max(scanLimit, 100), 10000);

  const rows = await db
    .select()
    .from(automationLogs)
    .orderBy(desc(automationLogs.seq))
    .limit(safeScanLimit);

  const grouped = new Map<string, ReporterRunSummary>();

  for (const row of rows) {
    const existing = grouped.get(row.runId);
    const isRowEnd = row.message === "row_end";
    let rowEndStatus: string | undefined;

    if (isRowEnd) {
      const parsedMeta = safeJsonParse(row.metaJson);
      const eventMeta =
        parsedMeta && "meta" in parsedMeta
          ? (parsedMeta.meta as Record<string, unknown> | undefined)
          : parsedMeta;

      rowEndStatus =
        eventMeta && "status" in eventMeta
          ? String(eventMeta.status)
          : undefined;
    }

    if (!existing) {
      grouped.set(row.runId, {
        runId: row.runId,
        jobId: row.jobId ?? undefined,
        runnerId: row.runnerId ?? undefined,
        firstTs: row.ts,
        lastTs: row.ts,
        totalEvents: 1,
        errorCount: row.level === "error" ? 1 : 0,
        warnCount: row.level === "warn" ? 1 : 0,
        status:
          rowEndStatus === "fail"
            ? "fail"
            : rowEndStatus === "ok"
              ? "ok"
              : "running",
        latestMessage: row.message,
      });
      continue;
    }

    existing.totalEvents += 1;
    if (row.level === "error") existing.errorCount += 1;
    if (row.level === "warn") existing.warnCount += 1;

    if (row.ts < existing.firstTs) existing.firstTs = row.ts;
    if (row.ts > existing.lastTs) existing.lastTs = row.ts;

    if (!existing.jobId && row.jobId) existing.jobId = row.jobId;
    if (!existing.runnerId && row.runnerId) existing.runnerId = row.runnerId;

    if (rowEndStatus === "fail") {
      existing.status = "fail";
    } else if (rowEndStatus === "ok" && existing.status !== "fail") {
      existing.status = "ok";
    }
  }

  return Array.from(grouped.values())
    .sort((a, b) => (a.lastTs > b.lastTs ? -1 : 1))
    .slice(0, safeLimit);
}

export async function deleteLogsForRun(runId: string) {
  await db.delete(automationLogs).where(eq(automationLogs.runId, runId));
  await db
    .delete(reporterRunSummaries)
    .where(eq(reporterRunSummaries.runId, runId));
  runSeqCache.delete(runId);
}

export async function deleteAllLogs() {
  await db.delete(automationLogs);
  await db.delete(reporterRunSummaries);
  runSeqCache.clear();
}
