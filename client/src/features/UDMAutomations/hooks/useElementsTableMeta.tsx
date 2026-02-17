import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TableMeta } from "@tanstack/react-table";
import type { ElementRow } from "../types/elements.types";
import { makeEmptyRow } from "../constants/elements.data";
import type { RowFieldErrors } from "../utils/elements.error";

export type ElementsTableMeta = TableMeta<ElementRow> & {
  updateData: <K extends keyof ElementRow>(
    rowIndex: number,
    columnId: K,
    value: ElementRow[K],
  ) => void;
  isSelected: (rowIndex: number) => boolean;
  toggleRow: (rowIndex: number) => void;
  toggleAll: () => void;
  deleteRow: (rowIndex: number) => void;
  selectedCount: number;
  rowCount: number;
};

type Args = {
  data: ElementRow[];
  setData: Dispatch<SetStateAction<ElementRow[]>>;
  selectedRows: Set<number>;
  setSelectedRows: Dispatch<SetStateAction<Set<number>>>;
  // typed correctly as React state setter for RowFieldErrors
  setErrors: Dispatch<SetStateAction<RowFieldErrors>>;
};

/**
 * Hook returns a memoized ElementsTableMeta object.
 * Callers should pass current data/selectedRows refs from state.
 */
export function useElementsTableMeta({
  data,
  setData,
  selectedRows,
  setSelectedRows,
  setErrors,
}: Args): ElementsTableMeta {
  const updateData = useCallback(
    <K extends keyof ElementRow>(
      rowIndex: number,
      columnId: K,
      value: ElementRow[K],
    ) => {
      setData((old) =>
        old.map((row, idx) =>
          idx === rowIndex
            ? ({ ...row, [columnId]: value } as ElementRow)
            : row,
        ),
      );

      // clear that specific field error as user edits
      setErrors((prev: RowFieldErrors) => {
        if (!prev[rowIndex]?.[columnId]) return prev;
        const nextRow = { ...(prev[rowIndex] ?? {}) };
        delete nextRow[columnId];
        return { ...prev, [rowIndex]: nextRow };
      });
    },
    [setData, setErrors],
  );

  const isSelected = useCallback(
    (rowIndex: number) => selectedRows.has(rowIndex),
    [selectedRows],
  );

  const toggleRow = useCallback(
    (rowIndex: number) =>
      setSelectedRows((prev) => {
        const next = new Set(prev);
        if (next.has(rowIndex)) next.delete(rowIndex);
        else next.add(rowIndex);
        return next;
      }),
    [setSelectedRows],
  );

  const toggleAll = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size === data.length) return new Set();
      return new Set(data.map((_, i) => i));
    });
  }, [data, setSelectedRows]);

  const deleteRow = useCallback(
    (rowIndex: number) => {
      setData((old) => {
        if (old.length <= 1) return [makeEmptyRow(1)];
        const next = old.filter((_, idx) => idx !== rowIndex);
        if (next.length === 0) return [makeEmptyRow(1)];
        return next;
      });

      setSelectedRows((prev) => {
        const next = new Set<number>();
        for (const idx of prev) {
          if (idx === rowIndex) continue;
          next.add(idx > rowIndex ? idx - 1 : idx);
        }
        return next;
      });
    },
    [setData, setSelectedRows],
  );

  return useMemo(
    () => ({
      updateData,
      isSelected,
      toggleRow,
      toggleAll,
      deleteRow,
      selectedCount: selectedRows.size,
      rowCount: data.length,
    }),
    [
      updateData,
      isSelected,
      toggleRow,
      toggleAll,
      deleteRow,
      selectedRows.size,
      data.length,
    ],
  );
}
