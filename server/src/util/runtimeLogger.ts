type LogLevel = "INFO" | "WARN" | "ERROR";
type LogContext = Record<string, unknown>;

function toLogValue(value: unknown) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toContextLine(context?: LogContext) {
  if (!context) return "";

  const items = Object.entries(context)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${toLogValue(value)}`);

  if (!items.length) return "";
  return ` | ${items.join(" ")}`;
}

function write(level: LogLevel, event: string, context?: LogContext) {
  const line = `[server][${level}] ${event}${toContextLine(context)}`;

  if (level === "ERROR") {
    console.error(line);
    return;
  }

  if (level === "WARN") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const serverLog = {
  info(event: string, context?: LogContext) {
    write("INFO", event, context);
  },
  warn(event: string, context?: LogContext) {
    write("WARN", event, context);
  },
  error(event: string, context?: LogContext) {
    write("ERROR", event, context);
  },
};
