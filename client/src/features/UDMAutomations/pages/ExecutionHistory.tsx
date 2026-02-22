import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { LogsTerminal } from "@features/UDMAutomations/components/LogsTerminal";
import {
  fetchRunEvents,
  fetchRunHistory,
  deleteAllRunEvents,
  deleteRunEvents,
  type RunEventsPage,
  type RunHistorySummary,
} from "@features/UDMAutomations/services/history.services";
import { useAutomationSessionStore } from "@features/UDMAutomations/store/automationUi.store";

type EventsByRun = Record<string, RunEventsPage | undefined>;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function toStatusClass(status: RunHistorySummary["status"]) {
  if (status === "ok") return "history-status history-status-ok";
  if (status === "fail") return "history-status history-status-fail";
  return "history-status history-status-running";
}

export function ExecutionHistoryPage() {
  const setCurrentRunId = useAutomationSessionStore(
    (state) => state.setCurrentRunId,
  );

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RunHistorySummary[]>([]);
  const [expandedRunIds, setExpandedRunIds] = useState<Set<string>>(new Set());
  const [eventsByRun, setEventsByRun] = useState<EventsByRun>({});
  const [loadingRunId, setLoadingRunId] = useState<string | null>(null);
  const [activeRunModalId, setActiveRunModalId] = useState<string | null>(null);
  const [deletingRunIds, setDeletingRunIds] = useState<Set<string>>(new Set());
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const filteredHistory = useMemo(() => {
    const token = query.trim().toLowerCase();
    if (!token) return history;
    return history.filter((item) => {
      return (
        item.runId.toLowerCase().includes(token) ||
        item.jobId?.toLowerCase().includes(token) ||
        item.latestMessage.toLowerCase().includes(token)
      );
    });
  }, [history, query]);

  const stats = useMemo(() => {
    return filteredHistory.reduce(
      (acc, item) => {
        acc.totalRuns += 1;
        acc.totalEvents += item.totalEvents;
        acc.totalErrors += item.errorCount;
        if (item.status === "fail") acc.failed += 1;
        if (item.status === "running") acc.running += 1;
        return acc;
      },
      {
        totalRuns: 0,
        totalEvents: 0,
        totalErrors: 0,
        failed: 0,
        running: 0,
      },
    );
  }, [filteredHistory]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchRunHistory(120);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load run history");
      }
      setHistory(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  useEffect(() => {
    if (!activeRunModalId) return;

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveRunModalId(null);
      }
    };

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [activeRunModalId]);

  const toggleRun = async (runId: string) => {
    setExpandedRunIds((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });

    if (eventsByRun[runId]) return;

    setLoadingRunId(runId);
    try {
      const response = await fetchRunEvents(runId, 120);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load run events");
      }
      setEventsByRun((prev) => ({ ...prev, [runId]: response.data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingRunId(null);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    const confirmed = window.confirm(
      `Delete all reporter events for run ${runId}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingRunIds((prev) => new Set(prev).add(runId));
    setError(null);
    try {
      const response = await deleteRunEvents(runId);
      if (!response.success) {
        throw new Error(response.message || "Failed to delete run events");
      }

      setHistory((prev) => prev.filter((run) => run.runId !== runId));
      setEventsByRun((prev) => {
        const next = { ...prev };
        delete next[runId];
        return next;
      });
      setExpandedRunIds((prev) => {
        const next = new Set(prev);
        next.delete(runId);
        return next;
      });
      if (activeRunModalId === runId) {
        setActiveRunModalId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingRunIds((prev) => {
        const next = new Set(prev);
        next.delete(runId);
        return next;
      });
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = window.confirm(
      "Delete ALL reporter events from history? This cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeletingAll(true);
    setError(null);
    try {
      const response = await deleteAllRunEvents();
      if (!response.success) {
        throw new Error(response.message || "Failed to delete all run events");
      }

      setHistory([]);
      setEventsByRun({});
      setExpandedRunIds(new Set());
      setActiveRunModalId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="history-layout">
      <section className="history-shell">
        <div className="history-hero">
          <p className="automation-deck-kicker">UDM Execution History</p>
          <h1 className="automation-deck-title">
            Grouped by runId for cleaner auditing
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse previous automation runs, inspect grouped events, and reopen
            any run in the live logs view.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="automation-chip automation-chip-primary">
              Runs: {stats.totalRuns}
            </span>
            <span className="automation-chip automation-chip-secondary">
              Events: {stats.totalEvents}
            </span>
            <span className="automation-chip automation-chip-secondary">
              Errors: {stats.totalErrors}
            </span>
            <span className="automation-chip automation-chip-secondary">
              Failed: {stats.failed}
            </span>
          </div>
        </div>

        <div className="history-card min-h-0 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by runId, jobId, or latest message"
              className="form-input"
            />
            <button
              type="button"
              onClick={() => void loadHistory()}
              className="btn"
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Refresh
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteAll()}
              className="btn-danger"
              disabled={isDeletingAll || history.length === 0}
              title="Delete all run history events"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
              {isDeletingAll ? "Deleting..." : "Delete all"}
            </button>
          </div>

          {error ? (
            <div className="mb-3 rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="elements-scrollbar flex-1 min-h-0 overflow-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="text-sm text-slate-500">
                Loading execution history...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-sm text-slate-500">
                No execution runs found.
              </div>
            ) : (
              filteredHistory.map((run) => {
                const isExpanded = expandedRunIds.has(run.runId);
                const events = eventsByRun[run.runId]?.items ?? [];

                return (
                  <article key={run.runId} className="history-run-card">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="text-left min-w-0"
                        onClick={() => void toggleRun(run.runId)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                          <p className="font-mono text-sm text-slate-800 truncate">
                            {run.runId}
                          </p>
                          <span className={toStatusClass(run.status)}>
                            {run.status}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-600 pl-6">
                          {run.jobId ? `job: ${run.jobId} · ` : ""}
                          started: {formatDate(run.firstTs)} · last:{" "}
                          {formatDate(run.lastTs)}
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            setCurrentRunId(run.runId);
                            setActiveRunModalId(run.runId);
                          }}
                        >
                          <ExternalLink className="w-3.5 h-3.5 inline mr-1" />{" "}
                          Open
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => void handleDeleteRun(run.runId)}
                          disabled={deletingRunIds.has(run.runId)}
                          title="Delete events for this run"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                          {deletingRunIds.has(run.runId)
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600 pl-6">
                      <span>Total events: {run.totalEvents}</span>
                      <span>Warnings: {run.warnCount}</span>
                      <span>Errors: {run.errorCount}</span>
                      <span className="truncate max-w-md">
                        Latest: {run.latestMessage}
                      </span>
                    </div>

                    {isExpanded ? (
                      <div className="mt-3 pl-6 space-y-2">
                        {loadingRunId === run.runId ? (
                          <div className="text-xs text-slate-500">
                            Loading run events...
                          </div>
                        ) : events.length === 0 ? (
                          <div className="text-xs text-slate-500">
                            No events returned for this run.
                          </div>
                        ) : (
                          events.map((event) => (
                            <div key={event.id} className="history-event-item">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-medium text-slate-700">
                                  {event.message}
                                </span>
                                <span className="text-slate-500">
                                  {formatDate(event.ts)}
                                </span>
                                <span className="text-slate-500">
                                  level: {event.level}
                                </span>
                                {event.ctx?.taskId ? (
                                  <span className="text-slate-500">
                                    task: {event.ctx.taskId}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {activeRunModalId
        ? createPortal(
            <>
              <div
                className="history-modal-overlay"
                onClick={() => setActiveRunModalId(null)}
              />
              <section
                className="history-modal"
                role="dialog"
                aria-modal="true"
              >
                <header className="history-modal-header">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-300">
                      Run details
                    </p>
                    <p className="font-mono text-sm">{activeRunModalId}</p>
                  </div>
                  <button
                    type="button"
                    className="automation-clear-btn"
                    onClick={() => setActiveRunModalId(null)}
                  >
                    <X className="w-3 h-3" /> Close
                  </button>
                </header>
                <div className="history-modal-body">
                  <LogsTerminal runId={activeRunModalId} />
                </div>
              </section>
            </>,
            document.getElementById("modal-dom") ?? document.body,
          )
        : null}
    </div>
  );
}
