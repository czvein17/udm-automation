import path from "node:path";

export function normalizeChannel(
  raw?: string | null,
): "msedge" | "chrome" | undefined {
  const s = normalizedString(raw);
  return s === "msedge" || s === "chrome" ? s : undefined;
}

export function normalizedString(value?: string | null): string | undefined {
  const v = (value ?? "").trim();
  return v === "" ? undefined : v;
}

export function resolveStorageStatePath(
  raw?: string | null,
): string | undefined {
  const p = normalizedString(raw);
  if (!p) return undefined;
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}
