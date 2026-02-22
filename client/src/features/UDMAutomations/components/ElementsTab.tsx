import { useMemo, useState, useRef, useEffect } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { elementRowsSchema } from "shared/dist/schema/elements.schema";
import { ElementsTable } from "@features/UDMAutomations/components/ElementsTable";

import type { ElementRow } from "@features/UDMAutomations/types/elements.types";
import { elementColumns } from "@features/UDMAutomations/components/elements.columns";
import {
  initialRows,
  makeEmptyRow,
} from "@features/UDMAutomations/constants/elements.data";
import {
  type RowFieldErrors,
  zodErrorToRowFieldErrors,
} from "@features/UDMAutomations/utils/elements.error";

import {
  useElementsTableMeta,
  type ElementsTableMeta as HookMeta,
} from "@features/UDMAutomations/hooks/useElementsTableMeta";
import { useElementServices } from "@features/UDMAutomations/hooks/useElementsServices";
import { ClipboardPaste, Plus, Table2 } from "lucide-react";
import {
  useAutomationSessionStore,
  useElementsDraftStore,
} from "@features/UDMAutomations/store/automationUi.store";
import { useShallow } from "zustand/react/shallow";
import {
  selectElementsDraftSlice,
  selectSetCurrentRunId,
} from "@features/UDMAutomations/store/automationUi.selectors";

type ElementsTableMeta = HookMeta;

// Known header aliases to map common Excel column names to ElementRow keys.
const HEADER_ALIASES: Record<
  string,
  | keyof import("@features/UDMAutomations/types/elements.types").ElementRow
  | null
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
  const setCurrentRunId = useAutomationSessionStore(selectSetCurrentRunId);
  const {
    elementRows,
    setElementRows,
    selectedRowIndexes,
    setSelectedRowIndexes,
  } = useElementsDraftStore(useShallow(selectElementsDraftSlice));

  const [data, setData] = useState<ElementRow[]>(() =>
    elementRows.length ? elementRows : initialRows,
  );
  const [selectedRows, setSelectedRows] = useState<Set<number>>(
    () => new Set(selectedRowIndexes),
  );

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<RowFieldErrors>({});

  useEffect(() => {
    setElementRows(data);
  }, [data, setElementRows]);

  useEffect(() => {
    setSelectedRowIndexes(Array.from(selectedRows));
  }, [selectedRows, setSelectedRowIndexes]);

  const { mutateFn: submitElementsList } = useElementServices({
    onSubmitted: setCurrentRunId,
  });

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

      const firstEmptyRowIndex = data.findIndex(isEmptyRow);
      let nextId =
        firstEmptyRowIndex >= 0
          ? data[firstEmptyRowIndex].id
          : data.length
            ? data[data.length - 1].id + 1
            : 1;
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

      const rows = text
        .trim()
        .split(/\r?\n/)
        .map((r) => r.split(/\t|,/));
      if (rows.length === 0) return;

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

      // if there's an initial empty row, prefer inserting at that index
      const firstEmptyRowIndex = data.findIndex(isEmptyRow);

      const headerToField: Record<string, string | null> = {};
      if (isHeader) {
        // treat first row as header
        const headers = first as string[];
        const normHeaders = headers.map((h) => normalize(h));
        for (let i = 0; i < headers.length; i++) {
          const h = headers[i];
          const hn = normHeaders[i];
          const alias = HEADER_ALIASES[hn];
          if (alias !== undefined) {
            headerToField[h] = alias;
            continue;
          }
          const nf = fieldNames.find((f) => normalize(f) === hn);
          headerToField[h] = nf ?? null;
        }

        // data rows start at 1
        const dataRows = rows.slice(1);

        // choose starting id: use empty-row id if found, otherwise append ids
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
        return;
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
    <div className="flex flex-col h-full min-h-0 gap-2">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={addRow}
          id="add-row-button"
          className="p-2 text-xs transition-all duration-200 ease-in-out rounded-md shadow-sm bg-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white"
          title="add new row"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handlePasteClipboard}
          id="paste-clipboard-button"
          className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold tracking-wide duration-200 ease-in-out bg-white border rounded-lg shadow-sm text-slate-600 border-slate-200 hover:bg-slate-900 hover:text-white"
          title="paste from clipboard"
        >
          <ClipboardPaste className="w-4 h-4" />

          <span>Paste</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold tracking-wide duration-200 ease-in-out bg-white border rounded-lg shadow-sm text-slate-600 border-slate-200 hover:bg-slate-900 hover:text-white"
        >
          <Table2 className="w-4 h-4" />
          <span>Load Excel</span>
        </button>
      </div>

      {/* Table */}
      <ElementsTable table={table} />
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="text-xs text-slate-500">
          Rows:{" "}
          <span className="font-semibold text-slate-700">{data.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-200 bg-white"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-wtwSecondary text-white"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
