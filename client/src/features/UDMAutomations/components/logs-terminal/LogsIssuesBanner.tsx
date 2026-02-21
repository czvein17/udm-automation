type LogsIssuesBannerProps = {
  issues: string[];
};

export function LogsIssuesBanner({ issues }: LogsIssuesBannerProps) {
  if (issues.length === 0) return null;

  return (
    <div className="logs-issues-banner">
      <div className="text-[11px] font-semibold text-rose-200">Issues</div>
      <ul className="mt-1 ml-4 list-disc text-[11px] text-rose-100">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}
