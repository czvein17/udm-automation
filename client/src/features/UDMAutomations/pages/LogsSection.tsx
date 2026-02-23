import { AutomationTerminalPage } from "./AutomationTerminalPage";
import { useAutomationSessionStore } from "@features/UDMAutomations/store/automationUi.store";

export const LogsSection = () => {
  const runId = useAutomationSessionStore((state) => state.currentRunId.trim());

  return (
    <section className="h-full min-h-0 flex flex-col gap-2 p-2">
      <AutomationTerminalPage runId={runId} />
    </section>
  );
};
