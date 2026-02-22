import { useMemo, useState, useRef, useEffect, type JSX } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useShallow } from "zustand/react/shallow";
import { ClipboardPaste, Plus, Table2 } from "lucide-react";

import {
  initialRows,
  makeEmptyRow,
} from "@features/UDMAutomations/constants/elements.data";

import {
  useElementsTableMeta,
  type ElementsTableMeta as HookMeta,
} from "@features/UDMAutomations/hooks/useElementsTableMeta";
import { useElementsImport } from "@features/UDMAutomations/hooks/useElementsImport";
import { useElementsSubmit } from "@features/UDMAutomations/hooks/useElementsSubmit";
import { useElementServices } from "@features/UDMAutomations/hooks/useElementsServices";

import { elementColumns } from "./elements.columns";
import { ElementsTable } from "./ElementsTable";
import { ElementsTabFooter } from "./ElementsTabFooter";
import { ElementsToolbarButton } from "./ElementsToolbarButton";
import type { ElementRow } from "@features/UDMAutomations/types/elements.types";

import {
  useAutomationSessionStore,
  useElementsDraftStore,
} from "@features/UDMAutomations/store/automationUi.store";
import {
  selectElementsDraftSlice,
  selectSetCurrentRunId,
} from "@features/UDMAutomations/store/automationUi.selectors";

type ElementsTableMeta = HookMeta;

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

  useEffect(() => {
    setElementRows(data);
  }, [data, setElementRows]);

  useEffect(() => {
    setSelectedRowIndexes(Array.from(selectedRows));
  }, [selectedRows, setSelectedRowIndexes]);

  const { mutateFn: submitElementsList } = useElementServices({
    onSubmitted: setCurrentRunId,
  });

  const { submitted, errors, setErrors, onSubmit } = useElementsSubmit({
    data,
    submitElementsList,
  });

  const { handleFileInputChange, handlePasteClipboard } = useElementsImport({
    data,
    setData,
    setErrors,
    fileInputRef,
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

  const addRow: () => void = () => {
    const lastId = data.length ? data[data.length - 1].id : 0;
    const nextId = lastId + 1;
    setData((prev) => [...prev, makeEmptyRow(nextId)]);
  };

  const clearAll: () => void = () => setData([makeEmptyRow(1)]);

  const toolbarButtons: {
    id: string;
    title: string;
    label?: string;
    icon: JSX.Element;
    onClick: () => void;
  }[] = [
    {
      id: "add-row-button",
      title: "add new row",
      icon: <Plus className="w-4 h-4" />,
      onClick: addRow,
    },
    {
      id: "paste-clipboard-button",
      title: "paste from clipboard",
      label: "Paste",
      icon: <ClipboardPaste className="w-4 h-4" />,
      onClick: () => void handlePasteClipboard(),
    },

    {
      id: "load-excel-button",
      title: "load from excel file",
      label: "Load Excel",
      icon: <Table2 className="w-4 h-4" />,
      onClick: () => fileInputRef.current?.click(),
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      <div className="flex justify-end gap-2">
        {toolbarButtons.map((button) => (
          <ElementsToolbarButton
            key={button.id}
            onClick={button.onClick}
            id={button.id}
            title={button.title}
            label={button.label}
            icon={button.icon}
          />
        ))}

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      <ElementsTable table={table} />
      <ElementsTabFooter
        rowCount={data.length}
        onClear={clearAll}
        onSubmit={onSubmit}
      />
    </div>
  );
}
