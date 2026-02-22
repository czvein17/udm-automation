import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";

import type { ElementRow } from "@features/UDMAutomations/types/elements.types";
import type { RowFieldErrors } from "@features/UDMAutomations/utils/elements.error";
import {
  buildHeaderMap,
  CLIPBOARD_HEADER_MATCH,
  EXCEL_HEADER_MATCH,
  getEditableFields,
  getInsertPosition,
  looksLikeHeader,
  mapDelimitedRowsByOrder,
  mapDelimitedRowsWithHeaders,
  mapObjectsToRows,
  mergeRowsReplacingFirstEmpty,
  parseClipboardRows,
  validateMappedRows,
} from "@features/UDMAutomations/utils/elements.import";

type UseElementsImportParams = {
  data: ElementRow[];
  setData: Dispatch<SetStateAction<ElementRow[]>>;
  setErrors: (errors: RowFieldErrors) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

function applyMappedRows(
  mappedRows: ElementRow[],
  firstEmptyRowIndex: number,
  setErrors: (errors: RowFieldErrors) => void,
  setData: Dispatch<SetStateAction<ElementRow[]>>,
) {
  const validation = validateMappedRows(mappedRows);

  if (!validation.success) {
    setErrors(validation.errors);
    return;
  }

  setErrors({});
  setData((prev) =>
    mergeRowsReplacingFirstEmpty(prev, validation.data, firstEmptyRowIndex),
  );
}

export function useElementsImport({
  data,
  setData,
  setErrors,
  fileInputRef,
}: UseElementsImportParams) {
  async function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = (await import("xlsx")) as typeof import("xlsx");

      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
        defval: null,
      });

      const editableFields = getEditableFields(data);
      const headers = raw.length ? Object.keys(raw[0]) : [];
      const headerMap = buildHeaderMap(
        headers,
        editableFields,
        EXCEL_HEADER_MATCH,
      );
      const { firstEmptyRowIndex, startId } = getInsertPosition(data);
      const mappedRows = mapObjectsToRows(raw, headerMap, startId);

      applyMappedRows(mappedRows, firstEmptyRowIndex, setErrors, setData);
    } catch (error) {
      console.error("Failed to import spreadsheet", error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePasteClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const rows = parseClipboardRows(text);
      if (rows.length === 0) return;

      const editableFields = getEditableFields(data);
      const { firstEmptyRowIndex, startId } = getInsertPosition(data);
      const firstRow = rows[0] ?? [];

      if (looksLikeHeader(firstRow)) {
        const headers = firstRow.map((cell) => String(cell));
        const headerMap = buildHeaderMap(
          headers,
          editableFields,
          CLIPBOARD_HEADER_MATCH,
        );
        const mappedRows = mapDelimitedRowsWithHeaders(
          rows.slice(1),
          headers,
          headerMap,
          startId,
        );

        applyMappedRows(mappedRows, firstEmptyRowIndex, setErrors, setData);
        return;
      }

      const mappedRows = mapDelimitedRowsByOrder(rows, startId);
      applyMappedRows(mappedRows, firstEmptyRowIndex, setErrors, setData);
    } catch (error) {
      console.error("Failed to paste data", error);
    }
  }

  return {
    handleFileInputChange,
    handlePasteClipboard,
  };
}
