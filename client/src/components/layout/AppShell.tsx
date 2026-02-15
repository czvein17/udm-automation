import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        height: "100vh",
      }}
    >
      <Sidebar />
      <main
        style={{ padding: 16, overflow: "auto" }}
        className="min-h-screen bg-[#f8fafc]"
      >
        {children}
      </main>
    </div>
  );
};
