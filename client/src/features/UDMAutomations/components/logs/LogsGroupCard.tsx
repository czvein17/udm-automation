import { ChevronRight } from "lucide-react";
import type { TaskGroup } from "@features/UDMAutomations/utils/LogsTerminal.mapper";
import { getGroupBadge, valueOrDash } from "./LogsTerminal.shared";

type LogsGroupCardProps = {
  group: TaskGroup;
};

export function LogsGroupCard({ group }: LogsGroupCardProps) {
  const badge = getGroupBadge(group);

  const logsHeader: { label: string; value: string | null | undefined }[] = [
    { label: "TASK ID", value: group.taskId },
    { label: "FIELD NAME", value: group.fieldName },
    { label: "ELEMENT NAME", value: group.elementName },
    { label: "ELEMENT ID", value: group.elementId },
    { label: "URL", value: group.url },
  ];

  return (
    <div className="logs-group-card pt-7">
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2 text-[11px] font-semibold text-slate-100">
        <span>Row #{group.rowIndex}</span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] uppercase ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-1 text-[11px] text-slate-200 space-y-0.5">
        {logsHeader.map((header) => (
          <div key={header.label} className="mt-1">
            <span className="logs-kv-label">{header.label}:</span>{" "}
            {header.label !== "URL" ? valueOrDash(header.value) : null}
            {header.label === "URL" && header.value && (
              <a
                href={header.value}
                target="_blank"
                rel="noreferrer"
                className="logs-link ml-1"
              >
                {header.value}
              </a>
            )}
          </div>
        ))}

        <div>
          <span className="logs-actions-label">ACTIONS:</span>
          {group.actions.length > 0 ? (
            <ul className="logs-actions-list mt-1 ml-4 list-none">
              {group.actions.map((action) => (
                <li key={action}>
                  <ChevronRight className="inline mr-1 w-3 h-3" /> {action}
                </li>
              ))}
            </ul>
          ) : (
            <span className="ml-1 text-slate-400">-</span>
          )}
        </div>

        {group.issues.length > 0 ? (
          <div>
            <span className="text-rose-300">ISSUES:</span>
            <ul className="mt-1 ml-4 list-disc text-rose-200">
              {group.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
