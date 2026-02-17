import { createFileRoute } from "@tanstack/react-router";

import { Request } from "../../features/UDMAutomations/pages/Request";

export const Route = createFileRoute("/app/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-8">
      <div className="grid grid-cols-2 grid-rows-[auto_1fr] gap-6 max-w-8xl mx-auto h-[calc(100vh-160px)]">
        <div className="col-span-2 card h-24">First: spans two columns</div>
        <Request />
        <div className="card overflow-auto">Third</div>
      </div>
    </div>
  );
}
