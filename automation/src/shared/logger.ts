import type { LogEvent, LogKind, LogLevel } from "@shared/types/log";

function emit(event: Omit<LogEvent, "t">) {
  const payload: LogEvent = {
    t: new Date().toISOString(),
    ...event,
  };

  process.stdout.write(JSON.stringify(payload) + "\n");
}

export function log(
  level: LogLevel,
  kind: LogKind,
  message: string,
  extra?: Partial<LogEvent>,
) {
  emit({
    level,
    kind,
    message,
    ...extra,
  });
}

export const runInfo = (message: string, extra?: Partial<LogEvent>) =>
  log("info", "run", message, extra);

export const stepInfo = (step: string, message: string, data?: unknown) =>
  log("info", "step", message, { step, data });

export const actionInfo = (
  step: string,
  action: string,
  message: string,
  data?: unknown,
) => log("info", "action", message, { step, action, data });

export const checkInfo = (step: string, message: string, data?: unknown) =>
  log("info", "check", message, { step, data });

export const err = (step: string, message: string, data?: unknown) =>
  log("error", "step", message, { step, data });
