import { createFileRoute } from "@tanstack/react-router";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const Route = createFileRoute("/app/preview")({
  component: RouteComponent,
});

function RouteComponent() {
  useDocumentTitle("Preview");

  return <div>Hello "/app/preview"!</div>;
}
