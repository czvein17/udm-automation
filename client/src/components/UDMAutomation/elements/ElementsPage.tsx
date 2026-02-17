import { useMemo, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  type TableMeta,
} from "@tanstack/react-table";

import type { ElementRow } from "./elements.types";
import { elementColumns } from "./elements.columns";
import { initialRows, makeEmptyRow } from "./elements.data";
import { ElementsTable } from "./components/ElementsTable";
import {
  type RowFieldErrors,
  zodErrorToRowFieldErrors,
} from "./elements.error";
import { elementRowsSchema } from "shared/dist/schema/elements.schema";

type ElementsTableMeta = TableMeta<ElementRow> & {
  updateData: (rowIndex: number, columnId: string, value: string) => void;
};

export function ElementsPage() {
  const [data, setData] = useState<ElementRow[]>(initialRows);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<RowFieldErrors>({});

  const columns = useMemo(
    () => elementColumns({ submitted, errors }),
    [submitted, errors],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData: (rowIndex: number, columnId: string, value: string) => {
        setData((old) =>
          old.map((row, idx) =>
            idx === rowIndex ? { ...row, [columnId]: value } : row,
          ),
        );

        // optional: clear that specific field error as user edits
        setErrors((prev) => {
          if (!prev[rowIndex]?.[columnId as keyof ElementRow]) return prev;

          const nextRow = {
            ...(prev[rowIndex] ?? {}),
          };

          delete nextRow[columnId as keyof ElementRow];
          return { ...prev, [rowIndex]: nextRow };
        });
      },

      // selection helpers
      isSelected: (rowIndex: number) => selectedRows.has(rowIndex),

      toggleRow: (rowIndex: number) => {
        setSelectedRows((prev) => {
          const next = new Set(prev);
          if (next.has(rowIndex)) next.delete(rowIndex);
          else next.add(rowIndex);
          return next;
        });
      },

      toggleAll: () => {
        setSelectedRows((prev) => {
          if (prev.size === data.length) return new Set();
          return new Set(data.map((_, i) => i));
        });
      },

      // delete a row by index and fix selection indices
      deleteRow: (rowIndex: number) => {
        setData((old) => {
          // if there's 1 or fewer rows, keep a single empty row instead of removing all
          if (old.length <= 1) return [makeEmptyRow(1)];

          const next = old.filter((_, idx) => idx !== rowIndex);
          // if for some reason next is empty, ensure one empty row remains
          if (next.length === 0) return [makeEmptyRow(1)];
          return next;
        });

        setSelectedRows((prev) => {
          // if only one row previously, clearing selection is fine
          if (selectedRows.size <= 1 && data.length <= 1) return new Set();

          const next = new Set<number>();
          for (const idx of prev) {
            if (idx === rowIndex) continue;
            next.add(idx > rowIndex ? idx - 1 : idx);
          }
          return next;
        });
      },

      selectedCount: selectedRows.size,
      rowCount: data.length,
    } as ElementsTableMeta,
  });

  const addRow = () => {
    const lastId = data.length ? data[data.length - 1].id : 0;
    const nextId = lastId + 1;
    setData((prev) => [...prev, makeEmptyRow(nextId)]);
  };

  const clearAll = () => setData([makeEmptyRow(1)]);

  const onSubmit = async () => {
    setSubmitted(true);

    const parsed = elementRowsSchema.safeParse(data);

    if (!parsed.success) {
      console.log("validation errors", parsed.error);
      setErrors(zodErrorToRowFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    // ✅ valid payload
    console.log("submit payload", parsed.data);

    try {
      await fetch("/api/v1/youtube/open-multiple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      {/* Table */}
      <ElementsTable table={table} />
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Rows:{" "}
          <span className="font-semibold text-slate-700">{data.length}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSubmit}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-wtwSecondary text-white"
          >
            Submit
          </button>

          <button
            type="button"
            onClick={addRow}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 text-white"
          >
            Add row
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-200 bg-white"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
