import type { LogEvent } from "../hooks/useLogsStream";

export type DisplayRow = {
  id: string;
  ts: string;
  level: "debug" | "info" | "warn" | "error";
  title: string;
  subtitle?: string;
  details?: Array<{ label: string; value: string }>;
  ctx?: Record<string, string>;
  messageKey?: string;
  raw?: string;
  kind?: "header" | "task" | "event" | "noise";
};

export type TaskGroup = {
  key: string;
  taskId?: string;
  rowIndex: number;
  fieldName?: string;
  elementId?: string;
  elementName?: string;
  displayName?: string;
  tableName?: string;
  url?: string;
  status?: "ok" | "fail";
  actions: string[];
  issues: string[];
};

export type HeaderInfo = {
  job?: string;
  run?: string;
  runner?: string;
  started?: string;
  config?: string;
};

export type LogsDisplayModel = {
  header: HeaderInfo;
  groups: TaskGroup[];
  globalIssues: string[];
};

type TaskGroupAccumulator = {
  group: TaskGroup;
  actionSet: Set<string>;
  issueSet: Set<string>;
};

export type LogsDisplayAccumulator = {
  runId: string;
  processedCount: number;
  header: HeaderInfo;
  groups: Map<string, TaskGroupAccumulator>;
  globalIssueSet: Set<string>;
  globalIssues: string[];
  nextFallbackRowIndex: number;
};

function safeJsonParse<T>(value?: string): T | null {
  if (!value) return null;
  const text = value.trim();
  if (!text) return null;
  if (!(text.startsWith("{") || text.startsWith("["))) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asText(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

function truncate(text: string, max = 120) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function toTitleCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function isNoiseLine(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed === "{" || trimmed === "}") return true;
  if (/^[-─]{8,}$/.test(trimmed)) return true;
  return false;
}

function toDetails(entries: Array<[string, unknown]>) {
  const details: Array<{ label: string; value: string }> = [];
  for (const [label, value] of entries) {
    const text = asText(value);
    if (!text) continue;
    details.push({ label, value: text });
  }
  return details.length ? details : undefined;
}

function detailValue(row: DisplayRow, label: string) {
  return row.details?.find((d) => d.label === label)?.value;
}

function formatActionFromRowStep(row: DisplayRow) {
  const value = detailValue(row, "value");
  if (value) return `${row.title}: ${value}`;

  const status = detailValue(row, "status");
  if (status) return `${row.title}: ${status}`;

  const action = detailValue(row, "action");
  if (action) return `${row.title}: ${action}`;

  if (!row.details || row.details.length === 0) return row.title;

  const pairs = row.details
    .filter((item) => item.label !== "rowIndex")
    .map((item) => `${item.label}: ${item.value}`);

  if (pairs.length === 0) return row.title;
  return `${row.title}: ${pairs.join(" • ")}`;
}

function sanitizeIssueText(issue?: string) {
  if (!issue) return undefined;

  const trimmed = issue.trim();
  if (!trimmed) return undefined;

  if (/failed query:/i.test(trimmed)) {
    return "Task log storage failed while processing this row.";
  }

  if (/sqlite_busy|database is locked/i.test(trimmed)) {
    return "Database is busy. Please try again.";
  }

  if (/^\[[0-9:]{8}\]\s+ERROR\s+/i.test(trimmed)) {
    return trimmed.replace(/^\[[0-9:]{8}\]\s+ERROR\s+/i, "");
  }

  return trimmed;
}

function toDisplayRow(event: LogEvent, index: number): DisplayRow | null {
  const msgJson = safeJsonParse<Record<string, unknown>>(event.message);
  const rawJson = safeJsonParse<Record<string, unknown>>(event.raw);
  const embedded =
    (isObject(msgJson) && (msgJson.message || msgJson.meta || msgJson.tag)
      ? msgJson
      : null) ??
    (isObject(rawJson) && (rawJson.message || rawJson.meta || rawJson.tag)
      ? rawJson
      : null);

  const message = asText(embedded?.message) ?? asText(event.message) ?? "";
  const levelValue = asText(embedded?.level);
  const ts = asText(embedded?.ts) ?? event.ts;
  const level =
    levelValue === "debug" ||
    levelValue === "info" ||
    levelValue === "warn" ||
    levelValue === "error"
      ? levelValue
      : event.level;
  const meta = isObject(embedded?.meta)
    ? embedded.meta
    : isObject(event.meta)
      ? event.meta
      : {};
  const ctx = isObject(embedded?.ctx)
    ? embedded.ctx
    : isObject(event.ctx)
      ? event.ctx
      : {};

  const ctxString: Record<string, string> = {};
  for (const [key, value] of Object.entries(ctx)) {
    const text = asText(value);
    if (text) ctxString[key] = text;
  }

  const rowId = asText(embedded?.id) ?? event.id ?? `${event.ts}-${index}`;
  const raw =
    event.raw ??
    (embedded ? JSON.stringify(embedded) : undefined) ??
    (message.startsWith("{") ? message : undefined);

  const cleaned = message.trim();
  if (isNoiseLine(cleaned)) return null;

  if (/^at\s+/.test(cleaned)) {
    return {
      id: rowId,
      ts,
      level,
      title: cleaned,
      raw: cleaned,
      kind: "noise",
    };
  }

  if (cleaned === "AUTOMATION RUN" || /^Job\s*:/.test(cleaned)) {
    return { id: rowId, ts, level, title: cleaned, raw, kind: "header" };
  }
  if (/^Run ID\s*:/.test(cleaned) || /^Run\s*:/.test(cleaned)) {
    return { id: rowId, ts, level, title: cleaned, raw, kind: "header" };
  }
  if (/^Runner\s*:/.test(cleaned) || /^Started\s*:/.test(cleaned)) {
    return { id: rowId, ts, level, title: cleaned, raw, kind: "header" };
  }
  if (/^Config\s*:/.test(cleaned)) {
    return { id: rowId, ts, level, title: cleaned, raw, kind: "header" };
  }

  if (message === "run_start") {
    const config = isObject(meta.config) ? meta.config : {};

    return {
      id: rowId,
      ts,
      level,
      title: "Run started",
      details: toDetails([
        ["jobId", meta.jobId],
        ["runId", meta.runId],
        ["runnerId", meta.runnerId],
        ["ts", meta.ts ?? ts],
        ["config.surveyline", config.surveyline],
        ["config.automationType", config.automationType],
        ["config.translation", config.translation],
      ]),
      messageKey: "run_start",
      ctx: ctxString,
      raw,
      kind: "header",
    };
  }

  if (message === "row_start") {
    const rowCtx = isObject(meta.ctx) ? meta.ctx : {};
    const rowCtxText: Record<string, string> = { ...ctxString };

    for (const [key, value] of Object.entries(rowCtx)) {
      const text = asText(value);
      if (text) rowCtxText[key] = text;
    }

    return {
      id: rowId,
      ts,
      level,
      title: "Row started",
      details: toDetails([["rowIndex", meta.rowIndex]]),
      messageKey: "row_start",
      ctx: rowCtxText,
      raw,
      kind: "event",
    };
  }

  if (message === "row_step") {
    const title = asText(meta.title) ?? "Step";
    const details = isObject(meta.details)
      ? toDetails(
          Object.entries(meta.details).map(
            ([key, value]) => [key, value] as [string, unknown],
          ),
        )
      : undefined;

    return {
      id: rowId,
      ts,
      level,
      title,
      details,
      messageKey: "row_step",
      ctx: ctxString,
      raw,
      kind: "event",
    };
  }

  if (message === "row_end") {
    const status = asText(meta.status)?.toLowerCase() ?? "ok";
    const errorObj = isObject(meta.error) ? meta.error : undefined;

    return {
      id: rowId,
      ts,
      level,
      title: status === "fail" ? "Row failed" : "Row completed",
      subtitle: asText(meta.summary),
      details: toDetails([
        ["rowIndex", meta.rowIndex],
        ["status", status],
        ["summary", meta.summary],
        ["err", errorObj?.message],
        ["errorCode", errorObj?.code],
        ["hint", errorObj?.hint],
      ]),
      messageKey: "row_end",
      ctx: ctxString,
      raw,
      kind: "event",
    };
  }

  if (message === "navigate") {
    const url = asText(meta.url);
    return {
      id: rowId,
      ts,
      level,
      title: "Navigate",
      subtitle: url,
      details: toDetails([["url", url]]),
      messageKey: "navigate",
      ctx: ctxString,
      raw,
      kind: "event",
    };
  }

  if (message === "element_status") {
    const status = asText(meta.status) ?? "Unknown";
    return {
      id: rowId,
      ts,
      level,
      title: "Element status",
      subtitle: toTitleCase(status),
      details: toDetails([
        ["taskId", asText(meta.taskId) ?? asText(ctx.taskId)],
        ["status", status],
      ]),
      messageKey: "element_status",
      ctx: ctxString,
      raw,
      kind: "event",
    };
  }

  if (message === "language_select_attempt") {
    const translation = asText(meta.translation) ?? "Unknown";
    return {
      id: rowId,
      ts,
      level,
      title: "Language select",
      subtitle: translation,
      details: toDetails([["translation", translation]]),
      messageKey: "language_select_attempt",
      ctx: ctxString,
      raw,
      kind: "event",
    };
  }

  if (message === "language_selected") {
    const translation = asText(meta.translation) ?? "Unknown";
    const selected = asText(meta.selected) ?? "true";
    return {
      id: rowId,
      ts,
      level,
      title: "Language selected",
      subtitle: translation,
      details: toDetails([
        ["translation", translation],
        ["selected", selected],
      ]),
      messageKey: "language_selected",
      ctx: ctxString,
      raw,
      kind: "event",
    };
  }

  if (message === "automation_action") {
    const action = asText(meta.action) ?? "unknown";
    return {
      id: rowId,
      ts,
      level,
      title: "Automation action",
      subtitle: action,
      details: toDetails([["action", action]]),
      messageKey: "automation_action",
      ctx: ctxString,
      raw,
      kind: "event",
    };
  }

  if (message === "automation_action_skipped") {
    const automationType =
      asText(meta.automationType) ?? asText(ctx.automationType);
    return {
      id: rowId,
      ts,
      level,
      title: "Automation skipped",
      subtitle: automationType,
      details: toDetails([
        ["taskId", asText(meta.taskId) ?? asText(ctx.taskId)],
        ["automationType", automationType],
      ]),
      messageKey: "automation_action_skipped",
      ctx: ctxString,
      raw,
      kind: "event",
    };
  }

  if (message === "result") {
    const result = asText(meta.result);
    return {
      id: rowId,
      ts,
      level,
      title: "Result",
      subtitle: result,
      details: toDetails([["result", result]]),
      messageKey: "result",
      ctx: ctxString,
      raw,
      kind: "event",
    };
  }

  const subtitle = [asText(ctx.fieldName), asText(ctx.elementId)]
    .filter(Boolean)
    .join(" • ");

  return {
    id: rowId,
    ts,
    level,
    title: truncate(cleaned || "(empty message)"),
    subtitle: subtitle || undefined,
    details: toDetails(
      Object.entries(meta).map(
        ([key, value]) => [key, value] as [string, unknown],
      ),
    ),
    messageKey: message || undefined,
    ctx: ctxString,
    raw,
    kind: "event",
  };
}

function groupKeyForRow(row: DisplayRow) {
  const taskId = row.ctx?.taskId ?? detailValue(row, "taskId");
  const rowIndex = row.ctx?.rowIndex ?? detailValue(row, "rowIndex");
  const fieldName = row.ctx?.fieldName;
  const elementId = row.ctx?.elementId;
  const elementName = row.ctx?.elementName;
  const displayName = row.ctx?.displayName;
  const tableName = row.ctx?.tableName;

  return (
    taskId ??
    rowIndex ??
    [fieldName, elementId, elementName, displayName, tableName]
      .filter(Boolean)
      .join("|")
  );
}

function toRowIndex(value?: string) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return undefined;
  return parsed;
}

function buildTaskGroups(rows: DisplayRow[]) {
  const groups = new Map<string, TaskGroup>();
  const actionSets = new Map<string, Set<string>>();
  const issueSets = new Map<string, Set<string>>();
  const globalIssueSet = new Set<string>();
  const globalIssues: string[] = [];
  let nextFallbackRowIndex = 1;

  for (const row of rows) {
    if (row.level === "error" && !groupKeyForRow(row)) {
      const issue = sanitizeIssueText(
        detailValue(row, "err") ?? row.subtitle ?? row.title,
      );
      if (issue && !globalIssueSet.has(issue)) {
        globalIssueSet.add(issue);
        globalIssues.push(issue);
      }
    }

    if (row.kind !== "event") continue;

    const fieldName = row.ctx?.fieldName;
    const elementId = row.ctx?.elementId;
    const elementName = row.ctx?.elementName;
    const displayName = row.ctx?.displayName;
    const tableName = row.ctx?.tableName;

    const key = groupKeyForRow(row);

    if (!key) continue;

    const parsedRowIndex =
      toRowIndex(row.ctx?.rowIndex) ?? toRowIndex(detailValue(row, "rowIndex"));

    const current = groups.get(key) ?? {
      key,
      taskId: undefined,
      rowIndex: parsedRowIndex ?? nextFallbackRowIndex,
      fieldName,
      elementId,
      elementName,
      displayName,
      tableName,
      url: undefined,
      status: undefined,
      actions: [],
      issues: [],
    };

    if (!groups.has(key) && parsedRowIndex === undefined) {
      nextFallbackRowIndex += 1;
    }

    const actionSet = actionSets.get(key) ?? new Set<string>();
    const issueSet = issueSets.get(key) ?? new Set<string>();
    actionSets.set(key, actionSet);
    issueSets.set(key, issueSet);

    const taskId = row.ctx?.taskId ?? detailValue(row, "taskId");
    const rowIndex = parsedRowIndex;
    current.taskId = current.taskId ?? taskId;
    if (rowIndex !== undefined) {
      current.rowIndex = rowIndex;
    }
    current.fieldName = current.fieldName ?? fieldName;
    current.elementId = current.elementId ?? elementId;
    current.elementName = current.elementName ?? elementName;
    current.displayName = current.displayName ?? displayName;
    current.tableName = current.tableName ?? tableName;

    const url = detailValue(row, "url") ?? row.subtitle;
    if (!current.url && row.title === "Navigate" && url) current.url = url;

    let action: string | undefined;
    switch (row.messageKey) {
      case "row_step":
        action = formatActionFromRowStep(row);
        break;
      case "row_end": {
        const status = (detailValue(row, "status") ?? "").toLowerCase();
        if (status === "ok" || status === "fail") {
          current.status = status;
        }
        break;
      }
      case "navigate":
        action = `Navigate${current.url ? `: ${current.url}` : ""}`;
        break;
      case "element_status": {
        const status = detailValue(row, "status") ?? row.subtitle ?? "Unknown";
        action = `Element Status: ${toTitleCase(status)}`;
        break;
      }
      case "language_select_attempt": {
        const translation =
          detailValue(row, "translation") ?? row.subtitle ?? "Unknown";
        action = `Language Select: ${translation}`;
        break;
      }
      case "language_selected": {
        const selected = (detailValue(row, "selected") ?? "true").toLowerCase();
        action = `Language Selected: ${selected === "true" ? "Yes" : "No"}`;
        break;
      }
      case "automation_action": {
        const rowAction =
          detailValue(row, "action") ?? row.subtitle ?? "unknown";
        action = `Automation Action: ${rowAction}`;
        break;
      }
      case "automation_action_skipped": {
        const skipped =
          detailValue(row, "automationType") ?? row.subtitle ?? "unknown";
        action = `Automation Skipped: ${skipped}`;
        break;
      }
      default:
        action = undefined;
        break;
    }

    if (action && !actionSet.has(action)) {
      actionSet.add(action);
      current.actions.push(action);
    }

    if (row.level === "error") {
      const issue = sanitizeIssueText(
        detailValue(row, "err") ?? row.subtitle ?? row.title,
      );
      if (issue && !issueSet.has(issue)) {
        issueSet.add(issue);
        current.issues.push(issue);
      }
    }

    groups.set(key, current);
  }

  return { groups: Array.from(groups.values()), globalIssues };
}

function compactStackTrace(rows: DisplayRow[]) {
  const out: DisplayRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!(row.kind === "noise" && /^at\s+/.test(row.title))) {
      out.push(row);
      continue;
    }

    const lines = [row.title];
    let j = i + 1;
    while (
      j < rows.length &&
      rows[j].kind === "noise" &&
      /^at\s+/.test(rows[j].title)
    ) {
      lines.push(rows[j].title);
      j += 1;
    }

    out.push({
      id: `${row.id}-stack`,
      ts: row.ts,
      level: row.level,
      title: `Stack trace (${lines.length} lines)`,
      raw: lines.join("\n"),
      kind: "noise",
    });
    i = j - 1;
  }
  return out;
}

function extractHeaderInfo(rows: DisplayRow[], runId: string): HeaderInfo {
  const info: HeaderInfo = { run: runId };
  for (const row of rows) {
    if (row.messageKey === "run_start") {
      const job = detailValue(row, "jobId");
      const run = detailValue(row, "runId");
      const runner = detailValue(row, "runnerId");
      const started = detailValue(row, "ts");
      const surveyline = detailValue(row, "config.surveyline");
      const type = detailValue(row, "config.automationType");
      const lang = detailValue(row, "config.translation");

      info.job = job ?? info.job;
      info.run = run ?? info.run;
      info.runner = runner ?? info.runner;
      info.started = started ?? info.started;

      const configParts = [
        surveyline ? `surveyline=${surveyline}` : undefined,
        type ? `type=${type}` : undefined,
        lang ? `lang=${lang}` : undefined,
      ].filter(Boolean);

      if (configParts.length > 0) {
        info.config = configParts.join(" | ");
      }
      continue;
    }

    const line = row.title.trim();
    let match: RegExpMatchArray | null = null;

    match = line.match(/^Job\s*:\s*(.+)$/i);
    if (match) {
      info.job = match[1];
      continue;
    }
    match = line.match(/^Run(?:\s*ID)?\s*:\s*(.+)$/i);
    if (match) {
      info.run = match[1];
      continue;
    }
    match = line.match(/^Runner\s*:\s*(.+)$/i);
    if (match) {
      info.runner = match[1];
      continue;
    }
    match = line.match(/^Started\s*:\s*(.+)$/i);
    if (match) {
      info.started = match[1];
      continue;
    }
    match = line.match(/^Config\s*:\s*(.+)$/i);
    if (match) {
      info.config = match[1];
      continue;
    }
  }
  return info;
}

function applyHeaderInfoFromRow(info: HeaderInfo, row: DisplayRow) {
  if (row.messageKey === "run_start") {
    const job = detailValue(row, "jobId");
    const run = detailValue(row, "runId");
    const runner = detailValue(row, "runnerId");
    const started = detailValue(row, "ts");
    const surveyline = detailValue(row, "config.surveyline");
    const type = detailValue(row, "config.automationType");
    const lang = detailValue(row, "config.translation");

    info.job = job ?? info.job;
    info.run = run ?? info.run;
    info.runner = runner ?? info.runner;
    info.started = started ?? info.started;

    const configParts = [
      surveyline ? `surveyline=${surveyline}` : undefined,
      type ? `type=${type}` : undefined,
      lang ? `lang=${lang}` : undefined,
    ].filter(Boolean);

    if (configParts.length > 0) {
      info.config = configParts.join(" | ");
    }

    return;
  }

  const line = row.title.trim();
  let match: RegExpMatchArray | null = null;

  match = line.match(/^Job\s*:\s*(.+)$/i);
  if (match) {
    info.job = match[1];
    return;
  }
  match = line.match(/^Run(?:\s*ID)?\s*:\s*(.+)$/i);
  if (match) {
    info.run = match[1];
    return;
  }
  match = line.match(/^Runner\s*:\s*(.+)$/i);
  if (match) {
    info.runner = match[1];
    return;
  }
  match = line.match(/^Started\s*:\s*(.+)$/i);
  if (match) {
    info.started = match[1];
    return;
  }
  match = line.match(/^Config\s*:\s*(.+)$/i);
  if (match) {
    info.config = match[1];
  }
}

function applyEventRowToAccumulator(
  row: DisplayRow,
  accumulator: LogsDisplayAccumulator,
) {
  if (row.level === "error" && !groupKeyForRow(row)) {
    const issue = sanitizeIssueText(
      detailValue(row, "err") ?? row.subtitle ?? row.title,
    );

    if (issue && !accumulator.globalIssueSet.has(issue)) {
      accumulator.globalIssueSet.add(issue);
      accumulator.globalIssues.push(issue);
    }
  }

  if (row.kind !== "event") return;

  const fieldName = row.ctx?.fieldName;
  const elementId = row.ctx?.elementId;
  const elementName = row.ctx?.elementName;
  const displayName = row.ctx?.displayName;
  const tableName = row.ctx?.tableName;

  const key = groupKeyForRow(row);
  if (!key) return;

  const parsedRowIndex =
    toRowIndex(row.ctx?.rowIndex) ?? toRowIndex(detailValue(row, "rowIndex"));

  const current =
    accumulator.groups.get(key) ??
    ({
      group: {
        key,
        taskId: undefined,
        rowIndex: parsedRowIndex ?? accumulator.nextFallbackRowIndex,
        fieldName,
        elementId,
        elementName,
        displayName,
        tableName,
        url: undefined,
        status: undefined,
        actions: [],
        issues: [],
      },
      actionSet: new Set<string>(),
      issueSet: new Set<string>(),
    } satisfies TaskGroupAccumulator);

  if (!accumulator.groups.has(key) && parsedRowIndex === undefined) {
    accumulator.nextFallbackRowIndex += 1;
  }

  const taskId = row.ctx?.taskId ?? detailValue(row, "taskId");
  const rowIndex = parsedRowIndex;
  current.group.taskId = current.group.taskId ?? taskId;
  if (rowIndex !== undefined) {
    current.group.rowIndex = rowIndex;
  }
  current.group.fieldName = current.group.fieldName ?? fieldName;
  current.group.elementId = current.group.elementId ?? elementId;
  current.group.elementName = current.group.elementName ?? elementName;
  current.group.displayName = current.group.displayName ?? displayName;
  current.group.tableName = current.group.tableName ?? tableName;

  const url = detailValue(row, "url") ?? row.subtitle;
  if (!current.group.url && row.title === "Navigate" && url) {
    current.group.url = url;
  }

  let action: string | undefined;
  switch (row.messageKey) {
    case "row_step":
      action = formatActionFromRowStep(row);
      break;
    case "row_end": {
      const status = (detailValue(row, "status") ?? "").toLowerCase();
      if (status === "ok" || status === "fail") {
        current.group.status = status;
      }
      break;
    }
    case "navigate":
      action = `Navigate${current.group.url ? `: ${current.group.url}` : ""}`;
      break;
    case "element_status": {
      const status = detailValue(row, "status") ?? row.subtitle ?? "Unknown";
      action = `Element Status: ${toTitleCase(status)}`;
      break;
    }
    case "language_select_attempt": {
      const translation =
        detailValue(row, "translation") ?? row.subtitle ?? "Unknown";
      action = `Language Select: ${translation}`;
      break;
    }
    case "language_selected": {
      const selected = (detailValue(row, "selected") ?? "true").toLowerCase();
      action = `Language Selected: ${selected === "true" ? "Yes" : "No"}`;
      break;
    }
    case "automation_action": {
      const rowAction = detailValue(row, "action") ?? row.subtitle ?? "unknown";
      action = `Automation Action: ${rowAction}`;
      break;
    }
    case "automation_action_skipped": {
      const skipped =
        detailValue(row, "automationType") ?? row.subtitle ?? "unknown";
      action = `Automation Skipped: ${skipped}`;
      break;
    }
    default:
      action = undefined;
      break;
  }

  if (action && !current.actionSet.has(action)) {
    current.actionSet.add(action);
    current.group.actions.push(action);
  }

  if (row.level === "error") {
    const issue = sanitizeIssueText(
      detailValue(row, "err") ?? row.subtitle ?? row.title,
    );
    if (issue && !current.issueSet.has(issue)) {
      current.issueSet.add(issue);
      current.group.issues.push(issue);
    }
  }

  accumulator.groups.set(key, current);
}

export function createLogsDisplayAccumulator(runId: string): LogsDisplayAccumulator {
  return {
    runId,
    processedCount: 0,
    header: { run: runId },
    groups: new Map<string, TaskGroupAccumulator>(),
    globalIssueSet: new Set<string>(),
    globalIssues: [],
    nextFallbackRowIndex: 1,
  };
}

export function appendLogsDisplayEvents(
  accumulator: LogsDisplayAccumulator,
  items: LogEvent[],
  startIndex: number,
) {
  for (let index = startIndex; index < items.length; index += 1) {
    const row = toDisplayRow(items[index]!, index);
    if (!row) continue;

    if (row.kind === "header") {
      applyHeaderInfoFromRow(accumulator.header, row);
      continue;
    }

    if (row.kind === "noise") continue;
    applyEventRowToAccumulator(row, accumulator);
  }

  accumulator.processedCount = items.length;
}

export function toLogsDisplayModel(
  accumulator: LogsDisplayAccumulator,
): LogsDisplayModel {
  return {
    header: accumulator.header,
    groups: Array.from(accumulator.groups.values()).map((entry) => entry.group),
    globalIssues: [...accumulator.globalIssues],
  };
}

export function buildLogsDisplayModel(
  items: LogEvent[],
  runId: string,
): LogsDisplayModel {
  const normalized: DisplayRow[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const row = toDisplayRow(items[index]!, index);
    if (row) normalized.push(row);
  }

  const compacted = compactStackTrace(normalized);
  const header = extractHeaderInfo(compacted, runId);

  const rows: DisplayRow[] = [];
  for (const row of compacted) {
    if (row.kind === "header" || row.kind === "noise") continue;
    rows.push(row);
  }

  const { groups, globalIssues } = buildTaskGroups(rows);

  return { header, groups, globalIssues };
}
