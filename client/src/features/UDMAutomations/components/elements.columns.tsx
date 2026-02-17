import type { ColumnDef } from "@tanstack/react-table";
import type { ElementRow } from "../types/elements.types";
import { EditableTextCell } from "./EditableTextCells";
import { type RowFieldErrors } from "../utils/elements.error";
import type { TableMeta } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
type ElementsTableMeta = TableMeta<ElementRow> & {
  isSelected: (rowIndex: number) => boolean;
  toggleRow: (rowIndex: number) => void;
  toggleAll: () => void;
  deleteRow: (rowIndex: number) => void;
  selectedCount: number;
  rowCount: number;
};

export function elementColumns(opts: {
  submitted: boolean;
  errors: RowFieldErrors;
}): ColumnDef<ElementRow>[] {
  const { submitted, errors } = opts;

  const errFor = (rowIndex: number, key: keyof ElementRow) =>
    submitted ? errors[rowIndex]?.[key] : undefined;

  return [
    {
      id: "select",
      header: ({ table }) => {
        const meta = table.options.meta as ElementsTableMeta | undefined;
        const all = !!(
          meta &&
          meta.selectedCount &&
          meta.selectedCount === meta.rowCount
        );
        return (
          <input
            type="checkbox"
            aria-label="select-all"
            checked={!!all}
            onChange={() => meta?.toggleAll?.()}
            className="mt-1"
          />
        );
      },
      cell: ({ row, table }) => {
        const meta = table.options.meta as ElementsTableMeta | undefined;
        const checked = meta?.isSelected?.(row.index) ?? false;
        return (
          <input
            type="checkbox"
            data-row={row.index}
            data-col="select"
            checked={checked}
            onChange={() => meta?.toggleRow?.(row.index)}
            className="mt-1 "
          />
        );
      },
    },
    {
      accessorKey: "fieldName",
      header: "Field Name",
      cell: ({ table, row, column, getValue }) => (
        <EditableTextCell
          table={table}
          row={row}
          column={column}
          value={getValue()}
          required
          placeholder="e.g. field_name"
          error={errFor(row.index, "fieldName")}
        />
      ),
    },
    {
      accessorKey: "elementId",
      header: "Element ID",
      cell: ({ table, row, column, getValue }) => (
        <EditableTextCell
          table={table}
          row={row}
          column={column}
          value={getValue()}
          required
          placeholder="e.g. 12345"
          error={errFor(row.index, "elementId")}
        />
      ),
    },
    {
      accessorKey: "tableName",
      header: "Table Name",
      cell: ({ table, row, column, getValue }) => (
        <EditableTextCell
          table={table}
          row={row}
          column={column}
          value={getValue()}
          required
          placeholder="e.g. element_table"
          error={errFor(row.index, "tableName")}
        />
      ),
    },
    {
      accessorKey: "elementName",
      header: "Element Name",
      cell: ({ table, row, column, getValue }) => (
        <EditableTextCell
          table={table}
          row={row}
          column={column}
          value={getValue()}
          placeholder="optional"
          error={errFor(row.index, "elementName")}
        />
      ),
    },
    {
      accessorKey: "displayName",
      header: "Display Name",
      cell: ({ table, row, column, getValue }) => (
        <EditableTextCell
          table={table}
          row={row}
          column={column}
          value={getValue()}
          required
          placeholder="e.g. Display Name"
          error={errFor(row.index, "displayName")}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row, table }) => {
        const meta = table.options.meta as ElementsTableMeta | undefined;
        return (
          <div className="flex items-center justify-end h-full" title="delete">
            <button
              onClick={() => meta?.deleteRow?.(row.index)}
              className="p-1 text-slate-500 hover:text-red-500 cursor-pointer rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];
}
