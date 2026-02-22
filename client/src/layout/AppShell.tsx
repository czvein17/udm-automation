import type { ReactNode } from "react";
import { Sidebar } from "@layout/Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="grid grid-cols-[260px_1fr] h-screen">
      <Sidebar />
      <main className="bg-[#f8fafc] overflow-auto p-4">{children}</main>
    </div>
  );
};
