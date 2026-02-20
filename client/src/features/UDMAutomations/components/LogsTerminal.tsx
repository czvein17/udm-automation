import { useEffect, useMemo, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { useLogsStream } from "../hooks/useLogsStream";
import { buildLogsDisplayModel } from "../utils/LogsTerminal.mapper";

type LogsTerminalProps = {
  runId: string;
};

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

  const displayModel = useMemo(
    () => buildLogsDisplayModel(items, runId),
    [items, runId],
  );

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
                  <span>Row {group.rowIndex ?? index + 1}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${group.status === "fail" || group.issues.length > 0 ? "bg-rose-700 text-rose-100" : group.status === "ok" ? "bg-emerald-700 text-emerald-100" : "bg-slate-700 text-slate-100"}`}
                  >
                    {group.status === "fail" || group.issues.length > 0
                      ? "fail"
                      : group.status === "ok"
                        ? "ok"
                        : "running"}
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
