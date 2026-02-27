import { toRunStatusTone } from "../../utils/automationTerminal.utils";

type AutomationStatusBadgeProps = {
  status: "RUNNING" | "PAUSED" | "CANCELLED" | "SUCCESS" | "ERROR";
};

export function AutomationStatusBadge({ status }: AutomationStatusBadgeProps) {
  return <span className={`terminal-status terminal-status-${toRunStatusTone(status)}`}>{status}</span>;
}
