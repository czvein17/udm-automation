import { useMemo, useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { elementRowsSchema } from "shared/dist/schema/elements.schema";
import { ElementsTable } from "./ElementsTable";

import type { ElementRow } from "../types/elements.types";
import { elementColumns } from "./elements.columns";
import { initialRows, makeEmptyRow } from "../constants/elements.data";
import {
  type RowFieldErrors,
  zodErrorToRowFieldErrors,
} from "../utils/elements.error";

import {
  useElementsTableMeta,
  type ElementsTableMeta as HookMeta,
} from "../hooks/useElementsTableMeta";
import { useElementServices } from "../hooks/useElementsServices";

type ElementsTableMeta = HookMeta;

export function ElementsTab() {
  const [data, setData] = useState<ElementRow[]>(initialRows);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<RowFieldErrors>({});

  const { mutateFn: submitElementsList } = useElementServices();

  const columns = useMemo(
    () => elementColumns({ submitted, errors }),
    [submitted, errors],
  );

  const meta = useElementsTableMeta({
    data,
    setData,
    selectedRows,
    setSelectedRows,
    setErrors,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: meta as ElementsTableMeta,
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
    console.log("submit payload", parsed.data);
    submitElementsList(parsed.data);
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
