import type {
  AutomationEvent,
  AutomationEventType,
  AutomationRunStatus,
} from "shared";
import type {
  AutomationTerminalRun,
  AutomationTerminalTask,
} from "./automationTerminal.types";

type RawEventRow = {
  id: string;
  runId: string;
  taskId: string;
  seq: number;
  type: string;
  details: string;
  payloadJson: string | null;
  createdAt: string;
};

type RawRunRow = {
  id: string;
  engine: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type RawTaskRow = {
  id: string;
  runId: string;
  fieldName: string | null;
  elementId: string | null;
  tableName: string | null;
  elementName: string | null;
  displayName: string | null;
  url: string | null;
};

const HARD_EVENT_LIMIT = 2000;
const DEFAULT_EVENT_LIMIT = 300;

export function parseLimit(limitParam: string | undefined) {
  if (!limitParam) return DEFAULT_EVENT_LIMIT;
  const parsed = Number(limitParam);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_EVENT_LIMIT;
  return Math.min(Math.floor(parsed), HARD_EVENT_LIMIT);
}

export function parseBeforeSeq(beforeSeqParam: string | undefined) {
  if (!beforeSeqParam) return undefined;
  const parsed = Number(beforeSeqParam);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.floor(parsed);
}

export function toAutomationEvent(row: RawEventRow): AutomationEvent {
  let payload: Record<string, unknown> | undefined;

  if (row.payloadJson) {
    try {
      const parsed = JSON.parse(row.payloadJson);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        payload = parsed as Record<string, unknown>;
      }
    } catch {
      payload = undefined;
    }
  }

  return {
    id: row.id,
    runId: row.runId,
    taskId: row.taskId,
    seq: row.seq,
    type: row.type as AutomationEventType,
    details: row.details,
    payload,
    createdAt: row.createdAt,
  };
}

export function toAutomationRun(row: RawRunRow): AutomationTerminalRun {
  return {
    id: row.id,
    engine: row.engine,
    status: row.status as AutomationRunStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toAutomationTask(row: RawTaskRow): AutomationTerminalTask {
  return {
    id: row.id,
    runId: row.runId,
    fieldName: row.fieldName,
    elementId: row.elementId,
    tableName: row.tableName,
    elementName: row.elementName,
    displayName: row.displayName,
    url: row.url,
  };
}

export function toNextBeforeSeq(events: AutomationEvent[]) {
  if (!events.length) return undefined;
  const firstSeq = events[0]?.seq;
  if (!firstSeq || firstSeq <= 1) return undefined;
  return firstSeq;
}
