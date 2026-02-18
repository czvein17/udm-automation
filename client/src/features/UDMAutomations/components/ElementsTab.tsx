import { useMemo, useState, useRef } from "react";
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
import { parsePastedClipboard } from "../utils/clipboard.util";

type ElementsTableMeta = HookMeta;

// Known header aliases to map common Excel column names to ElementRow keys.
const HEADER_ALIASES: Record<
  string,
  keyof import("../types/elements.types").ElementRow | null
> = {
  // main fields
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

  // known extras we currently ignore
  applicabilitiestag: null,
  stat: null,
  status: null,
};

export function ElementsTab() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  async function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();

      // dynamic import so the client bundle doesn't always include xlsx
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const XLSX = (await import("xlsx")) as any;

      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
        defval: null,
      });

      // heuristics to map incoming headers to our row fields
      const example = data.length ? data[0] : makeEmptyRow(1);
      const fieldNames = Object.keys(example);
      const normalize = (s: string) =>
        s.replace(/[^a-z0-9]/gi, "").toLowerCase();
      const normFields = fieldNames.map((f) => ({ f, n: normalize(f) }));

      const headers = raw.length ? Object.keys(raw[0]) : [];
      const headerToField: Record<string, string | null> = {};

      for (const h of headers) {
        const hn = normalize(h);

        // 0) explicit alias map
        const alias = HEADER_ALIASES[hn];
        if (alias !== undefined) {
          headerToField[h] = alias;
          continue;
        }

        const exact = fieldNames.find((f) => f === h);
        if (exact) {
          headerToField[h] = exact;
          continue;
        }
        const ci = fieldNames.find((f) => f.toLowerCase() === h.toLowerCase());
        if (ci) {
          headerToField[h] = ci;
          continue;
        }
        const nf = normFields.find((x) => x.n === hn);
        if (nf) {
          headerToField[h] = nf.f;
          continue;
        }
        const sub = fieldNames.find(
          (f) => normalize(f).includes(hn) || hn.includes(normalize(f)),
        );
        headerToField[h] = sub ?? null;
      }

      let nextId = data.length ? data[data.length - 1].id + 1 : 1;
      const mapped = raw.map((r) => {
        const base = makeEmptyRow(nextId++);
        for (const key of Object.keys(r)) {
          const field = headerToField[key];
          if (!field) continue;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (base as any)[field] = r[key] as any;
        }
        return base as ElementRow;
      });

      const parsed = elementRowsSchema.safeParse(mapped);
      if (!parsed.success) {
        setErrors(zodErrorToRowFieldErrors(parsed.error));
        return;
      }

      setErrors({});
      setData((prev) => [...prev, ...parsed.data]);
    } catch (err) {
      console.error("Failed to import spreadsheet", err);
    } finally {
      // clear the input so selecting the same file again triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePasteClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const { mapped, firstEmptyRowIndex } = parsePastedClipboard(
        text,
        data,
        HEADER_ALIASES,
      );

      if (mapped.length === 0) return;

      const parsed = elementRowsSchema.safeParse(mapped);
      if (!parsed.success) {
        setErrors(zodErrorToRowFieldErrors(parsed.error));
        return;
      }

      setErrors({});
      setData((prev) => {
        if (firstEmptyRowIndex >= 0) {
          return [
            ...prev.slice(0, firstEmptyRowIndex),
            ...parsed.data,
            ...prev.slice(firstEmptyRowIndex + 1),
          ];
        }
        return [...prev, ...parsed.data];
      });
    } catch (err) {
      console.error("Failed to paste data", err);
    }
  }

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

        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-200 text-slate-800"
          >
            Load Excel
          </button>

          <button
            type="button"
            onClick={handlePasteClipboard}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-200 text-slate-800"
          >
            Paste
          </button>

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
