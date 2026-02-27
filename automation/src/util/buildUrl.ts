const routeMap: Record<string, string> = {
  SUBMISSIONCOMPANY: "organization",
  SUBMISSIONUNIT: "organization",
  SUBMISSIONCONTACT: "organization",
  COMPANYDATA: "organization",

  SUBMISSIONINCUMBENT: "incumbent",
  SUBMISSIONGRANT: "incumbent",
};

export type SurveyCycleType = "ORG" | "INC" | "UNKNOWN";

function resolveRoute(tableName: string) {
  return routeMap[tableName] ?? tableName.toLowerCase();
}

function normalizeBase(base: string) {
  return base.replace(/\/$/, "");
}

export function buildRecordUrl(
  base: string,
  tableName: string,
  elementId: string,
) {
  const route = resolveRoute(tableName);
  return `${normalizeBase(base)}/${encodeURIComponent(route)}/${encodeURIComponent(elementId)}`;
}

export function buildCycleUrl(base: string, tableName: string) {
  const route = resolveRoute(tableName);
  return `${normalizeBase(base)}/${encodeURIComponent(route)}`;
}

export function identifySurveyCycleType(url: string): SurveyCycleType {
  const normalized = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();

  if (normalized.includes("/organization")) {
    return "ORG";
  }

  if (normalized.includes("/incumbent")) {
    return "INC";
  }

  return "UNKNOWN";
}
