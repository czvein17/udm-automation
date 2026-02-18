export function buildRecordUrl(
  base: string,
  tableName: string,
  elementId: string,
) {
  const routeMap: Record<string, string> = {
    SUBMISSIONCOMPANY: "organization",
    SUBMISSIONUNIT: "organization",
    SUBMISSIONCONTACT: "organization",
    COMPANYDATA: "organization",

    SUBMISSIONINCUMBENT: "incumbent",
    SUBMISSIONGRANT: "incumbent",
    // add more mappings here as needed
  };

  const route = routeMap[tableName] ?? tableName.toLowerCase();
  return `${base.replace(/\/$/, "")}/${encodeURIComponent(route)}/${encodeURIComponent(elementId)}`;
}
