import type { AutomationEventType, AutomationRunStatus } from "shared";

export type TerminalConnectionStatus = "connecting" | "connected" | "disconnected";

export type AutomationTerminalRun = {
  id: string;
  engine: string;
  status: AutomationRunStatus;
  createdAt: string;
  updatedAt: string;
};

export type AutomationTerminalTask = {
  id: string;
  runId: string;
  fieldName: string | null;
  elementId: string | null;
  tableName: string | null;
  elementName: string | null;
  displayName: string | null;
  url: string | null;
};

export type AutomationTerminalEvent = {
  id: string;
  runId: string;
  taskId: string;
  seq: number;
  type: AutomationEventType;
  details: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

export type AutomationTerminalSnapshot = {
  runId: string;
  run: AutomationTerminalRun;
  tasks: AutomationTerminalTask[];
  events: AutomationTerminalEvent[];
  page: {
    nextBeforeSeq?: number;
  };
};

export type AutomationTerminalEventsPage = {
  events: AutomationTerminalEvent[];
  page: {
    nextBeforeSeq?: number;
  };
};

export type AutomationTaskCardModel = {
  task: AutomationTerminalTask;
  events: AutomationTerminalEvent[];
  latestSeq: number;
  rowNumber: number | null;
  hasOverflow: boolean;
};

function isSamePayload(
  left?: Record<string, unknown>,
  right?: Record<string, unknown>,
) {
  if (left === right) return true;
  if (!left || !right) return !left && !right;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;

  for (const key of leftKeys) {
    if (left[key] !== right[key]) return false;
  }

  return true;
}

function isSameEvent(left: AutomationTerminalEvent, right: AutomationTerminalEvent) {
  return (
    left.id === right.id &&
    left.runId === right.runId &&
    left.taskId === right.taskId &&
    left.seq === right.seq &&
    left.type === right.type &&
    left.details === right.details &&
    left.createdAt === right.createdAt &&
    isSamePayload(left.payload, right.payload)
  );
}

function isSameTask(left: AutomationTerminalTask, right: AutomationTerminalTask) {
  return (
    left.id === right.id &&
    left.runId === right.runId &&
    left.fieldName === right.fieldName &&
    left.elementId === right.elementId &&
    left.tableName === right.tableName &&
    left.elementName === right.elementName &&
    left.displayName === right.displayName &&
    left.url === right.url
  );
}

export function mergeEvents(
  current: AutomationTerminalEvent[],
  incoming: AutomationTerminalEvent[],
) {
  if (!incoming.length) return current;
  if (!current.length) return [...incoming].sort((a, b) => a.seq - b.seq);

  const byId = new Map<string, AutomationTerminalEvent>(
    current.map((event) => [event.id, event]),
  );

  const additions: AutomationTerminalEvent[] = [];
  const currentLastSeq = current[current.length - 1]?.seq ?? Number.NEGATIVE_INFINITY;
  let appendOnly = true;
  let hasReplacement = false;

  for (const event of incoming) {
    const existing = byId.get(event.id);
    if (existing) {
      if (!isSameEvent(existing, event)) {
        byId.set(event.id, event);
        hasReplacement = true;
        if (event.seq <= currentLastSeq) {
          appendOnly = false;
        }
      }
      continue;
    }

    byId.set(event.id, event);
    additions.push(event);

    if (event.seq <= currentLastSeq) {
      appendOnly = false;
    }
  }

  if (!hasReplacement && additions.length === 0) {
    return current;
  }

  if (!hasReplacement && appendOnly) {
    if (additions.length <= 1) {
      return current.concat(additions);
    }

    return current.concat([...additions].sort((a, b) => a.seq - b.seq));
  }

  return Array.from(byId.values()).sort((a, b) => a.seq - b.seq);
}

export function mergeTasks(
  current: AutomationTerminalTask[],
  incoming: AutomationTerminalTask[],
) {
  if (!incoming.length) return current;
  if (!current.length) return incoming;

  const byId = new Map<string, AutomationTerminalTask>(
    current.map((task) => [task.id, task]),
  );
  let changed = false;

  for (const task of incoming) {
    const existing = byId.get(task.id);
    if (!existing) {
      byId.set(task.id, task);
      changed = true;
      continue;
    }

    if (!isSameTask(existing, task)) {
      byId.set(task.id, task);
      changed = true;
    }
  }

  if (!changed) return current;

  return Array.from(byId.values());
}

export function buildTaskCards(args: {
  tasks: AutomationTerminalTask[];
  events: AutomationTerminalEvent[];
  maxCards: number;
  defaultEventLimitPerTask: number;
  expandedTaskIds: Set<string>;
}) {
  const eventsByTaskId = new Map<string, AutomationTerminalEvent[]>();
  const rowNumberByTaskId = new Map<string, number>();

  for (const event of args.events) {
    const bucket = eventsByTaskId.get(event.taskId) ?? [];
    bucket.push(event);
    eventsByTaskId.set(event.taskId, bucket);

    if (!rowNumberByTaskId.has(event.taskId)) {
      const rowIndex = event.payload?.rowIndex;
      if (typeof rowIndex === "number" && Number.isFinite(rowIndex)) {
        rowNumberByTaskId.set(event.taskId, Math.floor(rowIndex));
      }
    }
  }

  const taskById = new Map(args.tasks.map((task) => [task.id, task]));

  for (const taskId of eventsByTaskId.keys()) {
    if (taskById.has(taskId)) continue;
    taskById.set(taskId, {
      id: taskId,
      runId: args.events[0]?.runId ?? "",
      fieldName: null,
      elementId: null,
      tableName: null,
      elementName: null,
      displayName: null,
      url: null,
    });
  }

  const cards: AutomationTaskCardModel[] = Array.from(taskById.values()).map((task) => {
    const taskEvents = eventsByTaskId.get(task.id) ?? [];
    const visibleEvents = args.expandedTaskIds.has(task.id)
      ? taskEvents
      : taskEvents.slice(-args.defaultEventLimitPerTask);
    const hasOverflow = taskEvents.length > args.defaultEventLimitPerTask;

    return {
      task,
      events: visibleEvents,
      latestSeq: taskEvents[taskEvents.length - 1]?.seq ?? 0,
      rowNumber: rowNumberByTaskId.get(task.id) ?? null,
      hasOverflow,
    };
  });

  cards.sort((a, b) => {
    const aRow = a.rowNumber;
    const bRow = b.rowNumber;

    if (aRow != null && bRow != null) {
      if (aRow !== bRow) return aRow - bRow;
      return b.latestSeq - a.latestSeq;
    }

    if (aRow != null) return -1;
    if (bRow != null) return 1;

    return b.latestSeq - a.latestSeq;
  });

  return cards.slice(0, args.maxCards);
}
