import { Link } from "@tanstack/react-router";
import { History, Monitor, Settings, X, Zap } from "lucide-react";

type SidebarProps = {
  onNavigate?: () => void;
  onClose?: () => void;
};

export const Sidebar = ({ onNavigate, onClose }: SidebarProps) => {
  const navLink = [
    {
      linkTo: "/app",
      label: "UDM Automation",
      icon: Monitor,
    },
    {
      linkTo: "/app/udm-execution-history",
      label: "Execution History",
      icon: History,
    },
    {
      linkTo: "/app/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="flex h-full flex-col border-r border-gray-200 bg-bgSecond">
      <div className="flex items-center gap-3 p-6">
        <div className="bg-wtwPrimary w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-wtwPrimary">
          <Zap fill="white" className="w-6 h-6" stroke="white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight bg-linear-to-r from-wtwPrimary to-wtwSecondary bg-clip-text text-transparent">
            Automation Suite
          </span>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            DM-Config Tool
          </p>
        </div>

        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {navLink.map((item) => (
          <Link
            key={item.linkTo}
            to={item.linkTo}
            activeOptions={{
              exact: item.linkTo === "/app",
            }}
            className="sidebar-link"
            activeProps={{
              className: "sidebar-link-active",
            }}
            onClick={onNavigate}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};
