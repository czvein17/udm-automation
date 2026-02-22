import { LogsTerminal } from "@features/UDMAutomations/components/logs";
import { useAutomationSessionStore } from "@features/UDMAutomations/store/automationUi.store";

export const LogsSection = () => {
  const currentRunId = useAutomationSessionStore((state) => state.currentRunId);

  return (
    <section className="h-full min-h-0 flex flex-col gap-2 p-2">
      <div className="flex-1 min-h-0">
        {currentRunId ? (
          <LogsTerminal runId={currentRunId} />
        ) : (
          <div className="automation-empty">
            Enter a run id in the top control deck to view logs.
          </div>
        )}
      </div>
    </section>
  );
};
