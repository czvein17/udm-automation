export type LogLevel = "info" | "error" | "warn" | "debug" | "success";

export function cliLog(
  runId: string,
  level: LogLevel,
  message: string,
  meta?: unknown,
) {
  const payload = {
    tag: "AUTOMATION",
    runId,
    level,
    ts: new Date().toISOString(),
    message,
    meta: meta ?? undefined,
  } as const;

  // Emit a single-line log that's easy to parse by the UI: prefix + JSON
  // Example: [AUTOMATION:tYV...] {"tag":"AUTOMATION",...}
  try {
    console.log(`[AUTOMATION:${runId}] ${JSON.stringify(payload)}`);
  } catch (e) {
    // fallback to minimal output if serialization fails
    console.log(`[AUTOMATION:${runId}] ${level}: ${message}`);
  }
}

export default cliLog;
