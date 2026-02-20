import { useEffect, useMemo, useRef } from "react";
import { useLogsStream, type LogEvent } from "../hooks/useLogsStream";
import { ChevronRight } from "lucide-react";

type LogsTerminalProps = {
  runId: string;
};

type DisplayRow = {
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

type TaskGroup = {
  key: string;
  taskId?: string;
  fieldName?: string;
  elementId?: string;
  elementName?: string;
  displayName?: string;
  tableName?: string;
  url?: string;
  actions: string[];
  issues: string[];
};

type HeaderInfo = {
  job?: string;
  run?: string;
  runner?: string;
  started?: string;
  config?: string;
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

  if (/^TASK:/i.test(cleaned)) {
    return {
      id: rowId,
      ts,
      level,
      title: "Task started",
      subtitle: cleaned.replace(/^TASK:\s*/i, ""),
      messageKey: "task_start",
      ctx: ctxString,
      raw,
      kind: "task",
    };
  }

  if (message === "task_start") {
    return {
      id: rowId,
      ts,
      level,
      title: "Task started",
      subtitle: asText(meta.taskName) ?? asText(meta.target),
      details: toDetails([
        ["taskName", meta.taskName],
        ["target", meta.target],
      ]),
      messageKey: "task_start",
      ctx: ctxString,
      raw,
      kind: "task",
    };
  }

  if (message === "task_end") {
    return {
      id: rowId,
      ts,
      level,
      title: "Task finished",
      subtitle: asText(meta.result),
      details: toDetails([
        ["taskName", meta.taskName],
        ["result", meta.result],
      ]),
      messageKey: "task_end",
      ctx: ctxString,
      raw,
      kind: "task",
    };
  }

  if (message === "config") {
    return {
      id: rowId,
      ts,
      level,
      title: "Loaded config",
      details: toDetails([
        ["configFor", meta.configFor],
        ["surveyline", meta.surveyline],
        ["automationType", meta.automationType],
        ["translation", meta.translation],
      ]),
      messageKey: "config",
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

function detailValue(row: DisplayRow, label: string) {
  return row.details?.find((d) => d.label === label)?.value;
}

function groupKeyForRow(row: DisplayRow) {
  const taskId = row.ctx?.taskId ?? detailValue(row, "taskId");
  const fieldName = row.ctx?.fieldName;
  const elementId = row.ctx?.elementId;
  const elementName = row.ctx?.elementName;
  const displayName = row.ctx?.displayName;
  const tableName = row.ctx?.tableName;

  return (
    taskId ??
    [fieldName, elementId, elementName, displayName, tableName]
      .filter(Boolean)
      .join("|")
  );
}

function buildTaskGroups(rows: DisplayRow[]) {
  const groups = new Map<string, TaskGroup>();

  for (const row of rows) {
    if (row.kind !== "event") continue;

    const fieldName = row.ctx?.fieldName;
    const elementId = row.ctx?.elementId;
    const elementName = row.ctx?.elementName;
    const displayName = row.ctx?.displayName;
    const tableName = row.ctx?.tableName;

    const key = groupKeyForRow(row);

    if (!key) continue;

    const current = groups.get(key) ?? {
      key,
      taskId: undefined,
      fieldName,
      elementId,
      elementName,
      displayName,
      tableName,
      url: undefined,
      actions: [],
      issues: [],
    };

    const taskId = row.ctx?.taskId ?? detailValue(row, "taskId");
    current.taskId = current.taskId ?? taskId;
    current.fieldName = current.fieldName ?? fieldName;
    current.elementId = current.elementId ?? elementId;
    current.elementName = current.elementName ?? elementName;
    current.displayName = current.displayName ?? displayName;
    current.tableName = current.tableName ?? tableName;

    const url = detailValue(row, "url") ?? row.subtitle;
    if (!current.url && row.title === "Navigate" && url) current.url = url;

    let action: string | undefined;
    switch (row.messageKey) {
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

    if (action && !current.actions.includes(action)) {
      current.actions.push(action);
    }

    if (row.level === "error") {
      const issue = detailValue(row, "err") ?? row.subtitle ?? row.title;
      if (issue && !current.issues.includes(issue)) {
        current.issues.push(issue);
      }
    }

    groups.set(key, current);
  }

  return Array.from(groups.values());
}

function buildGlobalIssues(rows: DisplayRow[]) {
  const issues: string[] = [];
  for (const row of rows) {
    if (row.level !== "error") continue;
    if (groupKeyForRow(row)) continue;
    const issue = detailValue(row, "err") ?? row.subtitle ?? row.title;
    if (!issue) continue;
    if (!issues.includes(issue)) issues.push(issue);
  }
  return issues;
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

export function LogsTerminal({ runId }: LogsTerminalProps) {
  const { items, totalCount, autoScroll, setAutoScroll, status } =
    useLogsStream(runId, 200);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoScroll) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [autoScroll, items.length]);

  const displayModel = useMemo(() => {
    const normalized = items
      .map((item, index) => toDisplayRow(item, index))
      .filter((row): row is DisplayRow => row !== null);

    const compacted = compactStackTrace(normalized);
    const header = extractHeaderInfo(compacted, runId);

    const rows = compacted.filter(
      (row) => row.kind !== "header" && row.kind !== "noise",
    );

    const groups = buildTaskGroups(rows);
    const globalIssues = buildGlobalIssues(rows);

    return { header, groups, globalIssues };
  }, [items, runId]);

  return (
    <div className="flex flex-col h-full min-h-0 border rounded border-slate-800 bg-slate-950 text-slate-100">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800 text-xs">
        <span className="font-semibold uppercase tracking-wide">Logs</span>
        <span className="text-slate-400">run: {runId}</span>
        <span className="text-slate-400">count: {totalCount}</span>

        <div className="ml-auto" />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          <span>Auto-scroll</span>
        </label>

        <span
          className={`px-2 py-1 rounded ${
            status === "connected"
              ? "bg-emerald-700 text-emerald-100"
              : status === "disconnected"
                ? "bg-rose-700 text-rose-100"
                : "bg-slate-700 text-slate-100"
          }`}
        >
          {status}
        </span>
      </div>

      {status === "disconnected" ? (
        <div className="px-3 py-2 text-xs bg-rose-900/40 border-b border-rose-800 text-rose-100">
          Live stream disconnected. Reconnect attempts exhausted.
        </div>
      ) : null}

      <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-300 bg-slate-900/30">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <span className="text-slate-500">Job:</span>{" "}
            {displayModel.header.job ?? "-"}
          </span>
          <span>
            <span className="text-slate-500">Run:</span>{" "}
            {displayModel.header.run ?? runId}
          </span>
          <span>
            <span className="text-slate-500">Runner:</span>{" "}
            {displayModel.header.runner ?? "-"}
          </span>
          <span>
            <span className="text-slate-500">Started:</span>{" "}
            {displayModel.header.started ?? "-"}
          </span>
        </div>
        {displayModel.header.config ? (
          <div className="mt-1">
            <span className="text-slate-500">Config:</span>{" "}
            {displayModel.header.config}
          </div>
        ) : null}
      </div>

      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-auto font-mono text-xs leading-5 px-3 py-2 space-y-1"
      >
        {displayModel.globalIssues.length > 0 ? (
          <div className="mb-3 border border-rose-700/70 rounded bg-rose-950/30 p-2">
            <div className="text-[11px] font-semibold text-rose-200">
              Issues
            </div>
            <ul className="mt-1 ml-4 list-disc text-[11px] text-rose-100">
              {displayModel.globalIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {displayModel.groups.length > 0 ? (
          <div className="mb-3 space-y-2">
            {displayModel.groups.map((group, index) => (
              <div
                key={group.key}
                className="border border-slate-700 rounded bg-slate-900/40 p-2"
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-100">
                  <span>Row {index + 1}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${group.issues.length > 0 ? "bg-rose-700 text-rose-100" : "bg-emerald-700 text-emerald-100"}`}
                  >
                    {group.issues.length > 0 ? "issue" : "ok"}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-300 space-y-0.5">
                  <div>
                    <span className="text-slate-500">TASK ID:</span>{" "}
                    {group.taskId ?? "-"}
                  </div>
                  <div>
                    <span className="text-slate-500">FIELD NAME:</span>{" "}
                    {group.fieldName ?? "-"}
                  </div>
                  <div>
                    <span className="text-slate-500">ELEMENT NAME:</span>{" "}
                    {group.elementName ?? "-"}
                  </div>
                  <div>
                    <span className="text-slate-500">ELEMENT ID:</span>{" "}
                    {group.elementId ?? "-"}
                  </div>
                  <div>
                    <span className="text-slate-500">URL:</span>{" "}
                    {group.url ? (
                      <a
                        href={group.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-300 hover:underline"
                      >
                        {group.url}
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500">ACTIONS:</span>
                    {group.actions.length > 0 ? (
                      <ul className="mt-1 ml-4 list-none text-slate-200">
                        {group.actions.map((action) => (
                          <li key={action}>
                            <ChevronRight className="inline mr-1 w-3 h-3" />{" "}
                            {action}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="ml-1 text-slate-400">-</span>
                    )}
                  </div>

                  {group.issues.length > 0 ? (
                    <div>
                      <span className="text-rose-300">ISSUES:</span>
                      <ul className="mt-1 ml-4 list-disc text-rose-200">
                        {group.issues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 border border-dashed border-slate-700 rounded p-3">
            No grouped rows yet. Run automation to populate logs.
          </div>
        )}
      </div>
    </div>
  );
}
