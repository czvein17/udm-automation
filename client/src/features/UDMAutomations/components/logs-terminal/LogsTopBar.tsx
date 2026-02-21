import type { LogsConnectionStatus } from "./LogsTerminal.shared";

type LogsTopBarProps = {
  runId: string;
  totalCount: number;
  autoScroll: boolean;
  setAutoScroll: (value: boolean) => void;
  status: LogsConnectionStatus;
};

export function LogsTopBar({
  runId,
  totalCount,
  autoScroll,
  setAutoScroll,
  status,
}: LogsTopBarProps) {
  const statusClass =
    status === "connected"
      ? "logs-status-connected"
      : status === "disconnected"
        ? "logs-status-disconnected"
        : "logs-status-neutral";

  return (
    <div className="logs-terminal-topbar">
      <span className="font-semibold uppercase tracking-wide text-slate-100">
        Logs
      </span>
      <span className="logs-terminal-muted">run: {runId}</span>
      <span className="logs-terminal-muted">count: {totalCount}</span>

      <div className="ml-auto" />

      <label className="flex items-center gap-2">
        <input
          className="accent-wtwSecondary"
          type="checkbox"
          checked={autoScroll}
          onChange={(e) => setAutoScroll(e.target.checked)}
        />
        <span className="text-slate-100">Auto-scroll</span>
      </label>

      <span className={`px-2 py-1 rounded ${statusClass}`}>
        {status}
      </span>
    </div>
  );
}
