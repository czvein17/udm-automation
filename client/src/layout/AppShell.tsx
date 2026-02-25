import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@layout/Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <button
        type="button"
        aria-label="Close navigation"
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity lg:hidden ${
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-40 w-[260px] transform bg-white transition-transform duration-200 lg:static lg:z-auto lg:w-auto lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          onNavigate={() => setIsSidebarOpen(false)}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <main className="bg-[#f8fafc] overflow-auto p-3 sm:p-4 lg:p-4">
        <header className="mb-3 flex items-center gap-3 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-slate-700">
            Automation Suite
          </span>
        </header>

        {children}
      </main>
    </div>
  );
};
