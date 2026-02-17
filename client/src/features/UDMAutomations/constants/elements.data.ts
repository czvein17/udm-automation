import type { ElementRow } from "../types/elements.types";

export function makeEmptyRow(id: number): ElementRow {
  return {
    id,
    fieldName: "",
    elementId: "",
    tableName: "",
    elementName: "",
    displayName: "",
  };
}

export const initialRows: ElementRow[] = [makeEmptyRow(1)];
