import { createFileRoute } from "@tanstack/react-router";

import { Request } from "@features/UDMAutomations/pages/Request";
import { LogsSection } from "@features/UDMAutomations/pages/LogsSection";
import { AutomationOverviewBar } from "@features/UDMAutomations/components";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const Route = createFileRoute("/app/")({
  component: RouteComponent,
});

function RouteComponent() {
  useDocumentTitle("Workspace");

  return (
    <div className="p-3 sm:p-5 lg:p-8">
      <div className="mx-auto grid max-w-8xl grid-cols-1 gap-3 lg:h-[calc(100vh-160px)] lg:grid-cols-[2.2fr_1.5fr] lg:grid-rows-[auto_1fr]">
        <AutomationOverviewBar />

        <div className="min-h-90 lg:min-h-0">
          <Request />
        </div>

        <div className="card min-h-75 overflow-hidden lg:min-h-0">
          <LogsSection />
        </div>
      </div>
    </div>
  );
}
