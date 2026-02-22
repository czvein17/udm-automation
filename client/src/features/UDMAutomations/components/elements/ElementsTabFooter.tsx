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
    <div className="flex items-center justify-between shrink-0">
      <div className="text-xs text-slate-500">
        Rows: <span className="font-semibold text-slate-700">{rowCount}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
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
  );
}
