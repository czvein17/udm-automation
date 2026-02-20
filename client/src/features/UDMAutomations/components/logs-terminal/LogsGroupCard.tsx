import { ChevronRight } from "lucide-react";
import type { TaskGroup } from "../../utils/LogsTerminal.mapper";
import { getGroupBadge, valueOrDash } from "./LogsTerminal.shared";

type LogsGroupCardProps = {
  group: TaskGroup;
};

export function LogsGroupCard({ group }: LogsGroupCardProps) {
  const badge = getGroupBadge(group);

  const LogsHeader: { label: string; value: string | null | undefined }[] = [
    {
      label: "TASK ID",
      value: group.taskId,
    },
    {
      label: "FIELD NAME",
      value: group.fieldName,
    },

    {
      label: "ELEMENT NAME",
      value: group.elementName,
    },
    {
      label: "ELEMENT ID",
      value: group.elementId,
    },
    {
      label: "URL",
      value: group.url,
    },
  ];

  return (
    <div className="relative border border-slate-700 rounded bg-slate-900/50 p-2">
      <div className="absolute top-2 right-2 flex items-center gap-2 text-[11px] font-semibold text-slate-100">
        <span>Row {group.rowIndex}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-1 text-[11px] text-slate-200 space-y-0.5">
        {LogsHeader.map((header) => (
          <div key={header.label} className="mt-1">
            <span className="text-cyan-300">{header.label}:</span>{" "}
            {header.label !== "URL" ? valueOrDash(header.value) : null}
            {header.label === "URL" && header.value && (
              <a
                href={header.value}
                target="_blank"
                rel="noreferrer"
                className="text-sky-300 hover:underline ml-1"
              >
                {header.value}
              </a>
            )}
          </div>
        ))}

        <div>
          <span className="text-emerald-300">ACTIONS:</span>
          {group.actions.length > 0 ? (
            <ul className="mt-1 ml-4 list-none text-amber-300">
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
