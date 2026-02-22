import { elementRowsSchema } from "shared/dist/schema/elements.schema";

import { makeEmptyRow } from "@features/UDMAutomations/constants/elements.data";
import type { ElementRow } from "@features/UDMAutomations/types/elements.types";
import {
  type RowFieldErrors,
  zodErrorToRowFieldErrors,
} from "@features/UDMAutomations/utils/elements.error";

export type EditableField = Exclude<keyof ElementRow, "id">;

export type HeaderMatchOptions = {
  allowCaseInsensitive: boolean;
  allowSubstring: boolean;
};

export type ValidationResult =
  | { success: true; data: ElementRow[] }
  | { success: false; errors: RowFieldErrors };

export const EXCEL_HEADER_MATCH: HeaderMatchOptions = {
  allowCaseInsensitive: true,
  allowSubstring: true,
};

export const CLIPBOARD_HEADER_MATCH: HeaderMatchOptions = {
  allowCaseInsensitive: false,
  allowSubstring: false,
};

const HEADER_ALIASES: Record<string, EditableField | null> = {
  fieldname: "fieldName",
  "field name": "fieldName",
  elementid: "elementId",
  "element id": "elementId",
  tablename: "tableName",
  "table name": "tableName",
  elementname: "elementName",
  "element name": "elementName",
  displayname: "displayName",
  "display name": "displayName",
  applicabilitiestag: null,
  stat: null,
  status: null,
};

const DEFAULT_ORDER: EditableField[] = [
  "fieldName",
  "elementId",
  "tableName",
  "elementName",
  "displayName",
];

function normalize(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isEmptyRow(row: ElementRow) {
  const isEmpty = (value?: string) => !value || String(value).trim() === "";
  return (
    isEmpty(row.fieldName) &&
    isEmpty(row.elementId) &&
    isEmpty(row.tableName) &&
    isEmpty(row.elementName) &&
    isEmpty(row.displayName)
  );
}

export function mergeRowsReplacingFirstEmpty(
  prev: ElementRow[],
  nextRows: ElementRow[],
  firstEmptyRowIndex: number,
) {
  if (firstEmptyRowIndex < 0) return [...prev, ...nextRows];

  return [
    ...prev.slice(0, firstEmptyRowIndex),
    ...nextRows,
    ...prev.slice(firstEmptyRowIndex + 1),
  ];
}

export function getEditableFields(data: ElementRow[]): EditableField[] {
  const example = data.length ? data[0] : makeEmptyRow(1);
  return Object.keys(example).filter(
    (field) => field !== "id",
  ) as EditableField[];
}

function resolveHeaderField(
  header: string,
  editableFields: EditableField[],
  options: HeaderMatchOptions,
): EditableField | null {
  const normalizedHeader = normalize(header);

  const alias = HEADER_ALIASES[normalizedHeader];
  if (alias !== undefined) return alias;

  const exact = editableFields.find((field) => field === header);
  if (exact) return exact;

  if (options.allowCaseInsensitive) {
    const caseInsensitive = editableFields.find(
      (field) => field.toLowerCase() === header.toLowerCase(),
    );
    if (caseInsensitive) return caseInsensitive;
  }

  const normalizedMatch = editableFields.find(
    (field) => normalize(field) === normalizedHeader,
  );
  if (normalizedMatch) return normalizedMatch;

  if (options.allowSubstring) {
    const substringMatch = editableFields.find((field) => {
      const normalizedField = normalize(field);
      return (
        normalizedField.includes(normalizedHeader) ||
        normalizedHeader.includes(normalizedField)
      );
    });

    if (substringMatch) return substringMatch;
  }

  return null;
}

export function buildHeaderMap(
  headers: string[],
  editableFields: EditableField[],
  options: HeaderMatchOptions,
) {
  const map: Record<string, EditableField | null> = {};

  for (const header of headers) {
    map[header] = resolveHeaderField(header, editableFields, options);
  }

  return map;
}

export function getInsertPosition(data: ElementRow[]) {
  const firstEmptyRowIndex = data.findIndex(isEmptyRow);
  const startId =
    firstEmptyRowIndex >= 0
      ? data[firstEmptyRowIndex].id
      : data.length
        ? data[data.length - 1].id + 1
        : 1;

  return { firstEmptyRowIndex, startId };
}

export function mapObjectsToRows(
  raw: Record<string, unknown>[],
  headerMap: Record<string, EditableField | null>,
  startId: number,
) {
  let nextId = startId;

  return raw.map((record) => {
    const row = makeEmptyRow(nextId++);

    for (const key of Object.keys(record)) {
      const field = headerMap[key];
      if (!field) continue;
      row[field] = String(record[key] ?? "");
    }

    return row;
  });
}

export function mapDelimitedRowsWithHeaders(
  rows: string[][],
  headers: string[],
  headerMap: Record<string, EditableField | null>,
  startId: number,
) {
  let nextId = startId;

  return rows.map((cols) => {
    const row = makeEmptyRow(nextId++);

    for (let index = 0; index < cols.length; index += 1) {
      const field = headerMap[headers[index]];
      if (!field) continue;
      row[field] = String(cols[index] ?? "");
    }

    return row;
  });
}

export function mapDelimitedRowsByOrder(rows: string[][], startId: number) {
  let nextId = startId;

  return rows.map((cols) => {
    const row = makeEmptyRow(nextId++);

    for (
      let index = 0;
      index < Math.min(cols.length, DEFAULT_ORDER.length);
      index += 1
    ) {
      const field = DEFAULT_ORDER[index];
      row[field] = String(cols[index] ?? "");
    }

    return row;
  });
}

export function parseClipboardRows(text: string) {
  return text
    .trim()
    .split(/\r?\n/)
    .map((row) => row.split(/\t|,/));
}

export function looksLikeHeader(row: string[]) {
  return row.some(
    (cell) => /[a-zA-Z]/.test(String(cell)) && !/^\d+$/.test(String(cell)),
  );
}

export function validateMappedRows(mappedRows: ElementRow[]): ValidationResult {
  const parsed = elementRowsSchema.safeParse(mappedRows);

  if (!parsed.success) {
    return {
      success: false,
      errors: zodErrorToRowFieldErrors(parsed.error),
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}
