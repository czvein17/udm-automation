import { createFileRoute } from "@tanstack/react-router";
import { ExecutionHistoryPage } from "@features/UDMAutomations/pages/ExecutionHistory";

export const Route = createFileRoute("/app/udm-execution-history")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ExecutionHistoryPage />;
}
