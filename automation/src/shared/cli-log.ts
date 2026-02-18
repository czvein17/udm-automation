export type LogLevel = "info" | "error" | "warn" | "debug" | "success";

export function cliLog(
  runId: string,
  level: LogLevel,
  message: string,
  meta?: unknown,
) {
  const ts = new Date().toISOString();

  // If environment requests machine-readable logs, keep original single-line JSON
  if (process.env.AUTOMATION_CLI_JSON === "1") {
    const payload = {
      tag: "AUTOMATION",
      runId,
      level,
      ts,
      message,
      meta: meta ?? undefined,
    } as const;
    try {
      console.log(`[AUTOMATION:${runId}] ${JSON.stringify(payload)}`);
    } catch (e) {
      console.log(`[AUTOMATION:${runId}] ${level}: ${message}`);
    }
    return;
  }

  // Human-friendly CLI formatting
  const levelToColor: Record<LogLevel, string> = {
    info: "\x1b[34m", // blue
    error: "\x1b[31m", // red
    warn: "\x1b[33m", // yellow
    debug: "\x1b[36m", // cyan
    success: "\x1b[32m", // green
  };
  const reset = "\x1b[0m";

  const coloredLevel = `${levelToColor[level] ?? ""}${level.toUpperCase()}${reset}`;

  // First line: compact single-line summary
  console.log(
    `[AUTOMATION] ${ts} | run=${runId} | ${coloredLevel} | ${message}`,
  );

  // If meta is present, print a readable representation below
  if (meta !== undefined && meta !== null) {
    try {
      if (typeof meta === "object") {
        // show a compact pretty JSON block
        const pretty = JSON.stringify(meta, null, 2);
        console.log(pretty);
      } else {
        console.log(String(meta));
      }
    } catch (e) {
      console.log(String(meta));
    }
  }
}

export default cliLog;
