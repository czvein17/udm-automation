import { and, desc, eq, lt, max } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@server/db/client";
import {
  automationEvents,
  automationRuns,
  automationTasks,
  tasks,
} from "@server/db/schema";
import type {
  AutomationEvent,
  AutomationRunStatus,
  CreateAutomationEventBody,
} from "shared";
import {
  toAutomationEvent,
  toAutomationRun,
  toAutomationTask,
} from "./automationTerminal.mapper";

type EventsQueryOptions = {
  runId: string;
  limit: number;
  beforeSeq?: number;
};

export async function ensureRun(runId: string, engine = "udm") {
  const existing = await db
    .select()
    .from(automationRuns)
    .where(eq(automationRuns.id, runId))
    .limit(1);

  if (existing[0]) return toAutomationRun(existing[0]);

  const now = new Date().toISOString();

  const created = await db
    .insert(automationRuns)
    .values({
      id: runId,
      engine,
      status: "RUNNING",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toAutomationRun(created[0]!);
}

export async function getRunById(runId: string) {
  const rows = await db
    .select()
    .from(automationRuns)
    .where(eq(automationRuns.id, runId))
    .limit(1);

  if (!rows[0]) return null;
  return toAutomationRun(rows[0]);
}

export async function updateRunStatus(runId: string, status: AutomationRunStatus) {
  const now = new Date().toISOString();

  await db
    .update(automationRuns)
    .set({
      status,
      updatedAt: now,
    })
    .where(eq(automationRuns.id, runId));

  const updated = await getRunById(runId);
  return updated;
}

export async function getMaxSeqForRun(runId: string) {
  const rows = await db
    .select({
      value: max(automationEvents.seq),
    })
    .from(automationEvents)
    .where(eq(automationEvents.runId, runId));

  return Number(rows[0]?.value ?? 0);
}

export async function insertEvent(input: {
  runId: string;
  seq: number;
  body: CreateAutomationEventBody;
}) {
  const eventId = nanoid();
  const createdAt = new Date().toISOString();

  const inserted = await db
    .insert(automationEvents)
    .values({
      id: eventId,
      runId: input.runId,
      taskId: input.body.taskId,
      seq: input.seq,
      type: input.body.type,
      details: input.body.details,
      payloadJson: input.body.payload ? JSON.stringify(input.body.payload) : null,
      createdAt,
    })
    .returning();

  return toAutomationEvent(inserted[0]!);
}

export async function upsertTaskFromEvent(input: {
  runId: string;
  taskId: string;
  payload?: AutomationEvent["payload"];
}) {
  const existing = await db
    .select()
    .from(automationTasks)
    .where(eq(automationTasks.id, input.taskId))
    .limit(1);

  if (existing[0]) {
    if (input.payload?.url) {
      await db
        .update(automationTasks)
        .set({
          url: String(input.payload.url),
        })
        .where(eq(automationTasks.id, input.taskId));
    }
    return;
  }

  const fromTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, input.taskId), eq(tasks.runId, input.runId)))
    .limit(1);

  const taskRow = fromTasks[0];

  const payload = input.payload ?? {};

  await db.insert(automationTasks).values({
    id: input.taskId,
    runId: input.runId,
    fieldName:
      (typeof payload.fieldName === "string" ? payload.fieldName : null) ??
      taskRow?.fieldName ??
      null,
    elementId:
      (typeof payload.elementId === "string" ? payload.elementId : null) ??
      taskRow?.elementId ??
      null,
    tableName:
      (typeof payload.tableName === "string" ? payload.tableName : null) ??
      taskRow?.tableName ??
      null,
    elementName:
      (typeof payload.elementName === "string" ? payload.elementName : null) ??
      taskRow?.elementName ??
      null,
    displayName:
      (typeof payload.displayName === "string" ? payload.displayName : null) ??
      taskRow?.displayName ??
      null,
    url: typeof payload.url === "string" ? payload.url : null,
  });
}

export async function getTasksByRunId(runId: string) {
  const rows = await db
    .select()
    .from(automationTasks)
    .where(eq(automationTasks.runId, runId));

  return rows.map(toAutomationTask);
}

export async function getEventsForTerminal(options: EventsQueryOptions) {
  const rows = options.beforeSeq
    ? await db
        .select()
        .from(automationEvents)
        .where(
          and(
            eq(automationEvents.runId, options.runId),
            lt(automationEvents.seq, options.beforeSeq),
          ),
        )
        .orderBy(desc(automationEvents.seq))
        .limit(options.limit)
    : await db
        .select()
        .from(automationEvents)
        .where(eq(automationEvents.runId, options.runId))
        .orderBy(desc(automationEvents.seq))
        .limit(options.limit);

  return rows.reverse().map(toAutomationEvent);
}

export async function hasOlderEvents(runId: string, beforeSeq: number) {
  const row = await db
    .select({ seq: automationEvents.seq })
    .from(automationEvents)
    .where(and(eq(automationEvents.runId, runId), lt(automationEvents.seq, beforeSeq)))
    .orderBy(desc(automationEvents.seq))
    .limit(1);

  return Boolean(row[0]);
}
