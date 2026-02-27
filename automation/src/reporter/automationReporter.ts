import type { AutomationEventType } from "@shared/automation/automationEvent.contract";
import { normalizeApiBaseUrl } from "../util/apiBaseUrl";
import { automationLog } from "../util/runtimeLogger";

const EVENT_POST_TIMEOUT_MS = 5000;

type ReporterEventInput = {
  type: AutomationEventType;
  details: string;
  payload?: Record<string, unknown>;
};

type ReporterOptions = {
  serverBaseUrl?: string;
  runId: string;
  taskId: string;
  taskMeta?: {
    rowIndex?: number;
    fieldName?: string;
    elementId?: string;
    tableName?: string;
    elementName?: string;
    displayName?: string;
    url?: string;
  };
};

export function createAutomationReporter(options: ReporterOptions) {
  const baseUrl = normalizeApiBaseUrl(options.serverBaseUrl);
  const endpoint = `${baseUrl}/api/v1/automation/runs/${encodeURIComponent(options.runId)}/events`;
  const basePayload = {
    ...(options.taskMeta ?? {}),
  };

  return {
    emit: async (event: ReporterEventInput) => {
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

      try {
        const controller = new AbortController();
        timeoutHandle = setTimeout(() => {
          controller.abort();
        }, EVENT_POST_TIMEOUT_MS);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            taskId: options.taskId,
            type: event.type,
            details: event.details,
            payload: {
              ...basePayload,
              ...(event.payload ?? {}),
            },
          }),
        });

        clearTimeout(timeoutHandle);

        if (!response.ok) {
          automationLog.warn("terminal_event.emit_http_error", {
            runId: options.runId,
            taskId: options.taskId,
            type: event.type,
            status: response.status,
          });
        }
      } catch (error) {
        automationLog.warn("terminal_event.emit_failed", {
          runId: options.runId,
          taskId: options.taskId,
          type: event.type,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
      }
    },
  };
}
