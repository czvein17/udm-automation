import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "../layout/AppShell";

export const Route = createFileRoute("/app")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
