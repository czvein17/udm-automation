import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends object> {
    updateData: <K extends keyof TData>(
      rowIndex: number,
      columnId: K,
      value: TData[K],
    ) => void;
  }
}
