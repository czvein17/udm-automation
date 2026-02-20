import type { HeaderInfo } from "../../utils/LogsTerminal.mapper";
import { valueOrDash } from "./LogsTerminal.shared";

type LogsRunHeaderProps = {
  header: HeaderInfo;
  runId: string;
};

export function LogsRunHeader({ header, runId }: LogsRunHeaderProps) {
  const headers: { label: string; value: string | null | undefined }[] = [
    {
      label: "Job",
      value: header.job,
    },
    {
      label: "Run",
      value: header.run ?? runId,
    },
    {
      label: "Runner",
      value: header.runner,
    },
    { label: "Started", value: header.started },
  ];

  return (
    <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-200 bg-slate-900/50">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {headers.map((h) => (
          <span key={h.label}>
            <span className="text-slate-400">{h.label}:</span>{" "}
            {valueOrDash(h.value)}
          </span>
        ))}
      </div>
      {header.config ? (
        <div className="mt-1">
          <span className="text-slate-400">Config:</span> {header.config}
        </div>
      ) : null}
    </div>
  );
}
