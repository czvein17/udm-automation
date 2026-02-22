import { flexRender, type Table } from "@tanstack/react-table";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { type ElementRow } from "../types/elements.types";

type Props = {
  table: Table<ElementRow>;
};

export function ElementsTable({ table }: Props) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      const el = bodyRef.current;
      if (!el) return;
      setScrollbarWidth(el.offsetWidth - el.clientWidth);
    };

    measure();

    const el = bodyRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    resizeObserver.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const renderColGroup = (count: number) => (
    <colgroup>
      {Array.from({ length: count }).map((_, index) => {
        const isFirstCol = index === 0;
        const isLastCol = index === count - 1;

        return (
          <col
            key={`col-${index}`}
            style={{
              width: isFirstCol ? "56px" : isLastCol ? "64px" : undefined,
            }}
          />
        );
      })}
    </colgroup>
  );

  return (
    <div className="flex-1 min-h-0 bg-white border rounded-lg shadow-xs border-slate-200 flex flex-col space-y-0.5">
      <div
        className="shrink-0 elements-header-wrap border-b border-slate-200"
        style={
          {
            "--elements-scrollbar-compensation": `${scrollbarWidth}px`,
          } as CSSProperties
        }
      >
        <table className="w-full border-collapse table-fixed">
          {renderColGroup(table.getAllLeafColumns().length)}
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-slate-200">
                {hg.headers.map((header, colIndex) => {
                  const isFirstCol = colIndex === 0;
                  const isLastCol = colIndex === hg.headers.length - 1;

                  return (
                    <th
                      key={header.id}
                      className={[
                        "py-2 text-xs font-semibold text-slate-600 tracking-wide",
                        isFirstCol ? "text-center" : "",
                        isLastCol ? "text-center" : "",
                        !isFirstCol && !isLastCol ? "px-3 text-left" : "",
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

      <div
        ref={bodyRef}
        className="elements-scrollbar flex-1 min-h-0 overflow-auto"
      >
        <table className="w-full border-collapse table-fixed">
          {renderColGroup(table.getAllLeafColumns().length)}
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const cells = row.getVisibleCells();
              return (
                <tr key={row.id}>
                  {cells.map((cell, colIndex) => {
                    const isFirstCol = colIndex === 0;
                    const isLastCol = colIndex === cells.length - 1;
                    const cls = [
                      "py-2",
                      isFirstCol ? "text-center" : "",
                      isLastCol ? "text-center py-3" : "",
                      !isFirstCol && !isLastCol ? "px-3" : "",
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
