type LogsIssuesBannerProps = {
  issues: string[];
};

export function LogsIssuesBanner({ issues }: LogsIssuesBannerProps) {
  if (issues.length === 0) return null;

  return (
    <div className="logs-issues-banner">
      <p className="text-xs font-semibold text-rose-200">Global Issues</p>
      <ul className="mt-1 ml-4 list-disc text-xs text-rose-100">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}
