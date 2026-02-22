import { createFileRoute } from "@tanstack/react-router";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const Route = createFileRoute("/app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  useDocumentTitle("Settings");

  return <div>Hello "/app/settings"!</div>;
}
