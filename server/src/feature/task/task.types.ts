export interface TaskLog {
  status: "success" | "failed" | "pending" | "error" | string;
  action: string;
  timestamp?: number | string;
}

export interface TaskEntry {
  taskId: string;
  fieldName?: string;
  logs: TaskLog[];
}

export interface TaskLogs {
  taskLogsId: string;
  runId: string;
  tasks: TaskEntry[];
}

// No default export — only types
