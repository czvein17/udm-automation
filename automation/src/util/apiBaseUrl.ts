const DEFAULT_API_BASE_URL = "http://localhost:3000";

export function normalizeApiBaseUrl(serverBaseUrl?: string) {
  const base =
    serverBaseUrl || process.env.BHVR_API_BASE_URL || DEFAULT_API_BASE_URL;

  return base.replace(/\/+$/, "");
}
