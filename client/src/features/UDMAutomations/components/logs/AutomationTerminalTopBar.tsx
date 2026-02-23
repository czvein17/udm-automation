import { Wifi, WifiOff } from "lucide-react";

import type { TerminalConnectionStatus } from "../../types/automationTerminal.types";
import { AutomationStatusBadge } from "./AutomationStatusBadge";

type AutomationTerminalTopBarProps = {
  runId: string;
  connectionStatus: TerminalConnectionStatus;
  runStatus: "RUNNING" | "PAUSED" | "CANCELLED" | "SUCCESS" | "ERROR";
  taskCount: number;
  eventCount: number;
};

export function AutomationTerminalTopBar({
  runId,
  connectionStatus,
  runStatus,
  taskCount,
  eventCount,
}: AutomationTerminalTopBarProps) {
  const connected = connectionStatus === "connected";

  return (
    <header className="terminal-topbar sticky top-0 z-10">
      <div className="terminal-topbar-left">
        <span className="terminal-run-id">run: {runId}</span>
        <AutomationStatusBadge status={runStatus} />
      </div>
      <div className="terminal-topbar-right">
        <span className={`terminal-ws ${connected ? "terminal-ws-up" : "terminal-ws-down"}`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connectionStatus}
        </span>
        <span className="terminal-counter">tasks: {taskCount}</span>
        <span className="terminal-counter">events: {eventCount}</span>
      </div>
    </header>
  );
}
