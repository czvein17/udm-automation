import { LogsTerminal } from "../components/LogsTerminal";
import { useShallow } from "zustand/react/shallow";
import { useAutomationSessionStore } from "../store/automationUi.store";
import { selectSessionRunIdSlice } from "../store/automationUi.selectors";

export const LogsSection = () => {
  const { currentRunId, setCurrentRunId } = useAutomationSessionStore(
    useShallow(selectSessionRunIdSlice),
  );

  return (
    <section className="h-full min-h-0 flex flex-col gap-2 p-2">
      <div className="flex items-center gap-2">
        <label htmlFor="logs-run-id" className="text-xs text-slate-600">
          Run ID
        </label>
        <input
          id="logs-run-id"
          name="logsRunId"
          value={currentRunId}
          onChange={(e) => setCurrentRunId(e.target.value)}
          placeholder="enter run id"
          className="form-input max-w-xs"
        />
      </div>

      <div className="flex-1 min-h-0">
        {currentRunId ? (
          <LogsTerminal runId={currentRunId} />
        ) : (
          <div className="h-full min-h-0 border rounded border-dashed border-slate-300 text-slate-500 text-sm flex items-center justify-center">
            Enter a run id to view logs.
          </div>
        )}
      </div>
    </section>
  );
};
