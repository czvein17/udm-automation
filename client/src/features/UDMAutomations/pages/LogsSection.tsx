import { useEffect, useState } from "react";
import { LogsTerminal } from "../components/LogsTerminal";

type LogsSectionProps = {
  runId?: string;
};

export const LogsSection = ({ runId: externalRunId }: LogsSectionProps) => {
  const [runId, setRunId] = useState("");

  useEffect(() => {
    if (!externalRunId) return;
    setRunId(externalRunId);
  }, [externalRunId]);

  return (
    <section className="h-full min-h-0 flex flex-col gap-2 p-2">
      <div className="flex items-center gap-2">
        <label htmlFor="logs-run-id" className="text-xs text-slate-600">
          Run ID
        </label>
        <input
          id="logs-run-id"
          name="logsRunId"
          value={runId}
          onChange={(e) => setRunId(e.target.value)}
          placeholder="enter run id"
          className="form-input max-w-xs"
        />
      </div>

      <div className="flex-1 min-h-0">
        {runId ? (
          <LogsTerminal runId={runId} />
        ) : (
          <div className="h-full min-h-0 border rounded border-dashed border-slate-300 text-slate-500 text-sm flex items-center justify-center">
            Enter a run id to view logs.
          </div>
        )}
      </div>
    </section>
  );
};
