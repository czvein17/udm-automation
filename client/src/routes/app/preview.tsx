import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/preview")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/preview"!</div>;
}
