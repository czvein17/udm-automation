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
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800 bg-slate-900/70 text-xs">
      <span className="font-semibold uppercase tracking-wide text-slate-100">
        Logs
      </span>
      <span className="text-slate-400">run: {runId}</span>
      <span className="text-slate-400">count: {totalCount}</span>

      <div className="ml-auto" />

      <label className="flex items-center gap-2">
        <input
          className="accent-cyan-500"
          type="checkbox"
          checked={autoScroll}
          onChange={(e) => setAutoScroll(e.target.checked)}
        />
        <span className="text-slate-200">Auto-scroll</span>
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
  );
}
