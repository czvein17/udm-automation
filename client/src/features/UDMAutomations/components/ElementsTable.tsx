import { flexRender, type Table } from "@tanstack/react-table";
import { type ElementRow } from "../types/elements.types";

type Props = {
  table: Table<ElementRow>;
};

export function ElementsTable({ table }: Props) {
  return (
    <div className="flex-1 min-h-0 bg-white border rounded-lg shadow-xs border-slate-200 flex flex-col">
      <div className="shrink-0">
        <table className="w-full border-collapse table-fixed">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-slate-200">
                {hg.headers.map((header, colIndex) => {
                  const isFirstCol = colIndex === 0;
                  const isLastCol = colIndex === hg.headers.length - 1;

                  return (
                    <th
                      key={header.id}
                      className={[
                        "px-2 py-2 text-left text-xs font-semibold text-slate-600 tracking-wide",
                        isFirstCol ? "pl-4 w-10" : "",
                        isLastCol ? "pr-4 w-10" : "",
                      ].join(" ")}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
        </table>
      </div>

      <div className="elements-scrollbar flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse table-fixed">
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const cells = row.getVisibleCells();
              return (
                <tr key={row.id}>
                  {cells.map((cell, colIndex) => {
                    const isFirstCol = colIndex === 0;
                    const isLastCol = colIndex === cells.length - 1;
                    const cls = [
                      "px-2 py-2 ",
                      isFirstCol ? "pl-4 w-10" : "",
                      isLastCol ? "pr-4 w-10 py-3" : "",
                      "align-top",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <td key={cell.id} className={cls}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* optional bottom space like "sheet" */}
        <div className="h-24" />
      </div>
    </div>
  );
}
