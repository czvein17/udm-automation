import { db } from "@server/db/client";
import { automationLogs } from "@server/db/schema";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import type { LogEvent } from "./logs.schema";

type LogRow = typeof automationLogs.$inferSelect;

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
  const rows = await withBusyRetry(() =>
    db
      .select({ maxSeq: sql<number>`coalesce(max(${automationLogs.seq}), 0)` })
      .from(automationLogs)
      .where(eq(automationLogs.runId, runId)),
  );

  const maxSeq = rows[0]?.maxSeq ?? 0;
  return maxSeq + 1;
}

export async function insertLog(event: LogEvent) {
  const seq = await getNextSeq(event.runId);
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

export async function deleteLogsForRun(runId: string) {
  await db.delete(automationLogs).where(eq(automationLogs.runId, runId));
}

export async function deleteAllLogs() {
  await db.delete(automationLogs);
}
