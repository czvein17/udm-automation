import type { ElementRow } from "../types/elements.types";
import { makeEmptyRow } from "../constants/elements.data";

export type HeaderAliases = Record<string, keyof ElementRow | null>;

/**
 * Parse a pasted table (TSV/CSV) into ElementRow objects using header-alias heuristics.
 * Returns mapped rows (unvalidated) and the index of the first empty row in `data` (-1 if none).
 */
export function parsePastedClipboard(
  text: string,
  data: ElementRow[],
  headerAliases: HeaderAliases,
): { mapped: ElementRow[]; firstEmptyRowIndex: number } {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((r) => r.split(/\t|,/));
  if (rows.length === 0) return { mapped: [], firstEmptyRowIndex: -1 };

  const first = rows[0];
  const isHeader = first.some(
    (c) => /[a-zA-Z]/.test(String(c)) && !/^\d+$/.test(String(c)),
  );

  const example = data.length ? data[0] : makeEmptyRow(1);
  const fieldNames = Object.keys(example);
  const normalize = (s: string) =>
    String(s)
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();

  // helper: detect a fully-empty row (excluding `id`)
  const isEmptyRow = (row: ElementRow) => {
    const isEmpty = (v?: string) => !v || String(v).trim() === "";
    return (
      isEmpty(row.fieldName) &&
      isEmpty(row.elementId) &&
      isEmpty(row.tableName) &&
      isEmpty(row.elementName) &&
      isEmpty(row.displayName)
    );
  };

  const firstEmptyRowIndex = data.findIndex(isEmptyRow);

  if (isHeader) {
    const headers = first as string[];
    const normHeaders = headers.map((h) => normalize(h));
    const headerToField: Record<string, string | null> = {};
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      const hn = normHeaders[i];
      const alias = headerAliases[hn];
      if (alias !== undefined) {
        headerToField[h] = alias as string | null;
        continue;
      }
      const nf = fieldNames.find((f) => normalize(f) === hn);
      headerToField[h] = nf ?? null;
    }

    const dataRows = rows.slice(1);
    let nextId =
      firstEmptyRowIndex >= 0
        ? data[firstEmptyRowIndex].id
        : data.length
          ? data[data.length - 1].id + 1
          : 1;

    const mapped = dataRows.map((cols) => {
      const base = makeEmptyRow(nextId++);
      for (let i = 0; i < cols.length; i++) {
        const h = headers[i];
        const field = headerToField[h];
        if (!field) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (base as any)[field] = cols[i];
      }
      return base as ElementRow;
    });

    return { mapped, firstEmptyRowIndex };
  }

  // No header: map by column count to default order
  const defaultOrder = [
    "fieldName",
    "elementId",
    "tableName",
    "elementName",
    "displayName",
  ];

  let nextId =
    firstEmptyRowIndex >= 0
      ? data[firstEmptyRowIndex].id
      : data.length
        ? data[data.length - 1].id + 1
        : 1;

  const mapped = rows.map((cols) => {
    const base = makeEmptyRow(nextId++);
    for (let i = 0; i < Math.min(cols.length, defaultOrder.length); i++) {
      const field = defaultOrder[i];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (base as any)[field] = cols[i];
    }
    return base as ElementRow;
  });

  return { mapped, firstEmptyRowIndex };
}
