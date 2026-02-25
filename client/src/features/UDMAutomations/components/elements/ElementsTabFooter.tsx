type ElementsTabFooterProps = {
  rowCount: number;
  onClear: () => void;
  onSubmit: () => void;
};

export function ElementsTabFooter({
  rowCount,
  onClear,
  onSubmit,
}: ElementsTabFooterProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <div className="text-xs text-slate-500">
        Rows: <span className="font-semibold text-slate-700">{rowCount}</span>
      </div>

      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        <button
          type="button"
          onClick={onClear}
          className="flex-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold sm:flex-none"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 rounded bg-wtwSecondary px-3 py-1.5 text-xs font-semibold text-white sm:flex-none"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
