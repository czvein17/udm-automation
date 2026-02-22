import { createFileRoute } from "@tanstack/react-router";
import { ExecutionHistoryPage } from "@features/UDMAutomations/pages/ExecutionHistory";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const Route = createFileRoute("/app/udm-execution-history")({
  component: RouteComponent,
});

function RouteComponent() {
  useDocumentTitle("Execution History");

  return <ExecutionHistoryPage />;
}
