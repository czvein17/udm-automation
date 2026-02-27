import type { Task } from "@shared/schema/task.schema";
import type { Config } from "@shared/schema/config.schema";
import type { ApiResponse } from "@shared/types";

import { normalizeApiBaseUrl } from "../util/apiBaseUrl";

export async function getTasksByRunId(
  runId: string,
  serverBaseUrl?: string,
): Promise<Task[]> {
  const baseUrl = normalizeApiBaseUrl(serverBaseUrl);
  const endpoint = `${baseUrl}/api/v1/automation/task-list/${encodeURIComponent(runId)}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch automation tasks (${response.status} ${response.statusText})`,
    );
  }

  const body = (await response.json()) as ApiResponse<Task[]>;
  if (!body.success) {
    throw new Error(body.message || "Failed to fetch automation tasks");
  }

  return body.data;
}

export async function getConfigFor(
  configFor: string,
  serverBaseUrl?: string,
): Promise<Config> {
  const baseUrl = normalizeApiBaseUrl(serverBaseUrl);
  const endpoint = `${baseUrl}/api/v1/configs/${encodeURIComponent(configFor)}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch config (${response.status} ${response.statusText})`,
    );
  }

  const body = (await response.json()) as ApiResponse<Config | null>;
  if (!body.success || !body.data) {
    throw new Error(body.message || "Config not found");
  }

  return body.data;
}
