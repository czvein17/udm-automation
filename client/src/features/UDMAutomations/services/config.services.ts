import { type CreateConfig } from "shared";
import { type ApiResponse } from "shared";

export const getConfigForService = async (configFor: string) => {
  const res = await fetch(`/api/v1/configs/${encodeURIComponent(configFor)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed to fetch config");
    throw new Error(text || "Failed to fetch config");
  }
  const data = (await res.json()) as ApiResponse<unknown>;
  return data.data;
};

export const createConfigService = async (payload: CreateConfig) => {
  const res = await fetch(`/api/v1/configs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed to create config");
    throw new Error(text || "Failed to create config");
  }
  const data = await res.json();
  return data.data;
};

export const updateConfigService = async (
  id: string,
  payload: CreateConfig,
) => {
  const res = await fetch(`/api/v1/configs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed to update config");
    throw new Error(text || "Failed to update config");
  }
  const data = await res.json();
  return data.data;
};

export const deleteConfigService = async (id: string) => {
  const res = await fetch(`/api/v1/configs/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Failed to delete config");
    throw new Error(text || "Failed to delete config");
  }
  const data = await res.json();
  return data.success ?? true;
};
