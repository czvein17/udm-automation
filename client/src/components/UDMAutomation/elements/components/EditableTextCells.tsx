import {
  KeyboardEventHandler,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Table, Row, Column } from "@tanstack/react-table";
import type { ElementRow } from "../elements.types";

type UpdateDataFn = (rowIndex: number, columnId: string, value: string) => void;

type Props = {
  table: Table<ElementRow>;
  row: Row<ElementRow>;
  column: Column<ElementRow, unknown>;
  value: unknown;

  required?: boolean;
  placeholder?: string;

  error?: string;
};

const arePropsEqual = (prev: Props, next: Props) =>
  prev.value === next.value &&
  prev.error === next.error &&
  prev.required === next.required &&
  prev.placeholder === next.placeholder &&
  prev.row.index === next.row.index &&
  prev.column.id === next.column.id &&
  prev.table === next.table;

export const EditableTextCell = memo(EditableTextCellInner, arePropsEqual);

export function EditableTextCellInner({
  table,
  row,
  column,
  value,
  required,
  placeholder,
  error,
}: Props) {
  console.log("Rendering Text Field For: " + placeholder + " " + value);

  const initial = (value ?? "").toString();
  const [local, setLocal] = useState(initial);

  useEffect(() => setLocal(initial), [initial]);

  const updateData = table.options.meta?.updateData as UpdateDataFn | undefined;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cols = useMemo(
    () => table.getVisibleLeafColumns().map((c) => String(c.id)),
    [table],
  );
  const trimmed = local.trim();

  const focusCell = useCallback((rowIndex: number, colId: string) => {
    const selector = `input[data-row="${rowIndex}"][data-col="${colId}"]`;
    const el = document.querySelector<HTMLInputElement>(selector);
    if (el) {
      el.focus();
      const len = el.value?.length ?? 0;
      el.setSelectionRange(len, len);
    }
  }, []);

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const idx = cols.indexOf(String(column.id));

      switch (e.key) {
        case "Enter":
        case "ArrowDown":
          e.preventDefault();
          updateData?.(row.index, column.id as string, trimmed);
          focusCell(row.index + 1, String(column.id));
          break;

        case "ArrowUp":
          e.preventDefault();
          focusCell(row.index - 1, String(column.id));
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (idx > 0) focusCell(row.index, cols[idx - 1]);
          break;

        case "ArrowRight":
          e.preventDefault();
          if (idx >= 0 && idx < cols.length - 1)
            focusCell(row.index, cols[idx + 1]);
          break;

        default:
          break;
      }
    },
    [cols, column.id, focusCell, trimmed, row.index, updateData],
  );

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        data-row={row.index}
        data-col={String(column.id)}
        value={local}
        placeholder={placeholder}
        onChange={useCallback((e) => setLocal(e.target.value), [])}
        onBlur={useCallback(
          () => updateData?.(row.index, column.id as string, trimmed),
          [updateData, row.index, column.id, trimmed],
        )}
        onKeyDown={onKeyDown}
        className={[
          "w-full bg-[#f8fafc] outline-none font-medium",
          "px-2 py-1 rounded",
          "text-[11px] text-slate-600",
          "ring-1 ring-slate-300",
          "focus:ring-wtwSecondary",
          error ? "ring-red-400" : "",
        ].join(" ")}
        required={required}
      />

      {/* optional small message */}
      {error ? (
        <div className="mt-1 text-[10px] text-red-500">{error}</div>
      ) : null}
    </div>
  );
}
